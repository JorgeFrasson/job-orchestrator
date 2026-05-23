import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { JobConsumerService } from './jobs-consumer.service';
import { JobLifecycleConsumerService } from './job-lifecycle-consumer.service';
import { JobProducerService } from './jobs-producer.service';
import { TopicProvisioningService } from '../kafka/topic-provisioning.service';

@Injectable()
export class JobRuntimeService {
  private readonly logger = new Logger(JobRuntimeService.name);

  constructor(
    private readonly producer: JobProducerService,
    private readonly consumer: JobConsumerService,
    private readonly lifecycleConsumer: JobLifecycleConsumerService,
    private readonly topicProvisioning: TopicProvisioningService,
  ) {}

  async ensureTopicInfrastructure(topic: string) {
    await this.topicProvisioning.ensureJobTopics(topic);
    await this.producer.registerProducerForTopic(topic);
    await this.consumer.registerConsumerForJob(topic, async (payload) => {
      this.logger.log(`Command received on ${topic}: ${JSON.stringify(payload)}`);
    });
    await this.lifecycleConsumer.registerLifecycleConsumersForJob(topic);
  }

  async sendToJobTopic(topic: string, message: Record<string, unknown>) {
    await this.producer.registerProducerForTopic(topic);
    await this.producer.sendToJobTopic(topic, message);
  }

  async sendRegistrationConfirmation(topic: string) {
    await this.sendToJobTopic(topic, {
      event: 'JOB_REGISTERED',
      timestamp: Date.now(),
    });
  }

  async startJob(topic: string, payload: unknown = {}, metadata: Record<string, unknown> = {}) {
    await this.sendToJobTopic(topic, {
      command: 'start',
      executionId: randomUUID(),
      payload,
      ...metadata,
    });
  }
}
