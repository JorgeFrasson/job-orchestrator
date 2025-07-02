// src/jobs/jobs.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RegisterJobDto } from './dto/register-job.dto';
import { JobProducerService } from './jobs-producer.service';
import { JobConsumerService } from './jobs-consumer.service';
import { JobLifecycleConsumerService } from './job-lifecycle-consumer.service';
import { Job } from '../models/job.model';
import * as cron from 'node-cron';

// interface JobEntry removida: configuração agora é apenas no core via HTTP

@Injectable()
export class JobsService {
  constructor(
    private readonly producer: JobProducerService,
    private readonly consumer: JobConsumerService,
    private readonly jobLifecycleConsumerService: JobLifecycleConsumerService,
    @InjectModel(Job) private jobModel: typeof Job,
  ) {}

  private readonly logger = new Logger(JobsService.name);
  private jobs = new Map<string, { topic: string; service: string }>();

  /** Chamado quando o SDK publica no tópico principal */
  async handleJobRegistration(dto: RegisterJobDto) {
    const topic = dto.topic;
    const service = dto.service;

    // 1) Registra Producer e Consumer
    await this.producer.registerProducerForTopic(topic);
    await this.consumer.registerConsumerForJob(topic, async (payload) => {
      this.logger.log(`CMD recebido em ${topic}: ${JSON.stringify(payload)}`);
      // ex: await this.myUseCase.execute(payload);
    });

    // Registra os consumers de lifecycle para <topic>-start e <topic>-end
    await this.jobLifecycleConsumerService.registerLifecycleConsumersForJob(topic);

    // 2) Persiste o Job no banco (ignora config)
    let job = await this.jobModel.findOne({ where: { topic } });
    if (!job) {
      job = await this.jobModel.create({
        topic: topic,
        service: service
      } as any);
    } else {
      await job.update({ service });
    }

    // 3) Armazena estado atualizado (em memória, opcional)
    this.jobs.set(topic, { topic, service });

    // 4) Confirma registro para o job
    await this.producer.sendToJobTopic(topic, {
      event: 'JOB_REGISTERED',
      timestamp: Date.now(),
    });

    return { status: 'ok', topic };
  }

  /** Lista todos os jobs registrados */
  listJobs() {
    return Array.from(this.jobs.entries()).map(([topic, { service }]) => ({ topic, service }));
  }

  /** Permite disparo manual de um job já registrado */
  async triggerJobManually(topic: string, payload = {}) {
    if (!this.jobs.has(topic)) {
      throw new Error(`Job ${topic} não registrado`);
    }
    await this.producer.sendToJobTopic(topic, { command: 'start', payload });
  }
}