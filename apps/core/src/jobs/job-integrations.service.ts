import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Job } from '../models/job.model';

interface JobIntegration {
  id: string;
  type: 'lambda' | 'webhook';
  event: 'onStart' | 'onFinish';
  config: {
    code?: string;
    url?: string;
    method?: 'GET' | 'POST' | 'PUT';
    headers?: Record<string, string>;
    payload?: string;
  };
}

@Injectable()
export class JobIntegrationsService {
  private readonly logger = new Logger(JobIntegrationsService.name);

  constructor(@InjectModel(Job) private readonly jobModel: typeof Job) {}

  async executeLifecycleEvent(
    topic: string,
    event: 'onStart' | 'onFinish',
    payload: unknown,
  ) {
    const job = await this.jobModel.findOne({
      where: { topic },
      include: ['config'],
    });

    if (!job?.config?.integrations?.length) {
      return;
    }

    const integrations = (job.config.integrations as JobIntegration[]).filter(
      (integration) => integration.event === event,
    );

    for (const integration of integrations) {
      try {
        if (integration.type === 'webhook') {
          await this.executeWebhookIntegration(job, integration, payload, event);
          continue;
        }

        if (integration.type === 'lambda') {
          await this.executeLambdaIntegration(job, integration, payload, event);
        }
      } catch (error) {
        this.logger.error(
          `Falha ao executar integração ${integration.id} de ${topic}: ${error.message || error}`,
        );
      }
    }
  }

  private async executeWebhookIntegration(
    job: Job,
    integration: JobIntegration,
    payload: unknown,
    event: 'onStart' | 'onFinish',
  ) {
    if (!integration.config.url) {
      this.logger.warn(`Integração ${integration.id} sem URL para ${job.topic}`);
      return;
    }

    const method = integration.config.method || 'POST';
    const templatePayload = integration.config.payload;
    const requestBody = templatePayload
      ? this.interpolateTemplate(templatePayload, job, payload, event)
      : JSON.stringify({ job, payload, event });

    const response = await fetch(integration.config.url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...integration.config.headers,
      },
      body: method === 'GET' ? undefined : requestBody,
    });

    if (!response.ok) {
      throw new Error(`Webhook respondeu ${response.status} ${response.statusText}`);
    }

    this.logger.log(`Webhook ${integration.id} executado para ${job.topic}`);
  }

  private async executeLambdaIntegration(
    job: Job,
    integration: JobIntegration,
    payload: unknown,
    event: 'onStart' | 'onFinish',
  ) {
    if (!integration.config.code) {
      this.logger.warn(`Integração ${integration.id} sem código para ${job.topic}`);
      return;
    }

    const run = new Function(
      'job',
      'payload',
      'context',
      `"use strict"; return (async () => { ${integration.config.code} })();`,
    );

    await run(job.toJSON(), payload, {
      event,
      timestamp: Date.now(),
      integrationId: integration.id,
    });

    this.logger.log(`Lambda ${integration.id} executada para ${job.topic}`);
  }

  private interpolateTemplate(
    template: string,
    job: Job,
    payload: unknown,
    event: 'onStart' | 'onFinish',
  ) {
    return template
      .replaceAll('{{job.topic}}', job.topic)
      .replaceAll('{{event}}', event)
      .replaceAll('{{payload}}', JSON.stringify(payload ?? null));
  }
}
