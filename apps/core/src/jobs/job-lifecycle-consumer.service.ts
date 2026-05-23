import { Injectable, Logger } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { JobIntegrationsService } from './job-integrations.service';
import { getKafkaCoreConfig } from '../kafka/kafka.config';
import { JobExecutionHistoryService } from './job-execution-history.service';

@Injectable()
export class JobLifecycleConsumerService {
  private kafka: Kafka;
  private consumers: Map<string, Consumer> = new Map();
  private readonly logger = new Logger(JobLifecycleConsumerService.name);

  constructor(
    private readonly integrationsService: JobIntegrationsService,
    private readonly historyService: JobExecutionHistoryService,
  ) {
    const kafkaConfig = getKafkaCoreConfig();
    this.kafka = new Kafka({
      clientId: `${kafkaConfig.clientId}-lifecycle-consumer`,
      brokers: kafkaConfig.brokers,
    });
  }

  async registerLifecycleConsumersForJob(topic: string) {
    await this.createConsumer(`${topic}-start`, async (payload) => {
      this.logger.log(`[${topic}-start] Job started: ${JSON.stringify(payload)}`);
      await this.historyService.recordLifecycleEvent(topic, 'start', payload);
      await this.integrationsService.executeLifecycleEvent(topic, 'onStart', payload);
    });
    await this.createConsumer(`${topic}-end`, async (payload) => {
      this.logger.log(`[${topic}-end] Job finished: ${JSON.stringify(payload)}`);
      await this.historyService.recordLifecycleEvent(topic, 'end', payload);
      await this.integrationsService.executeLifecycleEvent(topic, 'onFinish', payload);
    });
    await this.createConsumer(`${topic}-fail`, async (payload) => {
      this.logger.log(`[${topic}-fail] Job failed: ${JSON.stringify(payload)}`);
      await this.historyService.recordLifecycleEvent(topic, 'fail', payload);
    });
  }

  private async createConsumer(topic: string, onMessage: (payload: any) => Promise<void>) {
    if (this.consumers.has(topic)) return;
    const consumer = this.kafka.consumer({ groupId: `core-${topic}-group` });
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });
    await consumer.run({
      eachMessage: async ({ message }) => {
        let payload;
        try {
          payload = message.value ? JSON.parse(message.value.toString()) : undefined;
        } catch {
          payload = message.value?.toString();
        }
        await onMessage(payload);
      }
    });
    this.consumers.set(topic, consumer);
    this.logger.log(`Consumer registered for topic: ${topic}`);
  }
}
