import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Admin, Kafka } from 'kafkajs';
import {
  KafkaCoreConfig,
  KafkaTopicSpecification,
  createJobTopicSpecifications,
  getKafkaCoreConfig,
} from './kafka.config';

@Injectable()
export class TopicProvisioningService implements OnModuleDestroy {
  private readonly logger = new Logger(TopicProvisioningService.name);
  private readonly config: KafkaCoreConfig;
  private readonly kafka: Kafka;
  private admin: Admin;
  private connected = false;

  constructor() {
    this.config = getKafkaCoreConfig();
    this.kafka = new Kafka({
      clientId: `${this.config.clientId}-admin`,
      brokers: this.config.brokers,
    });
    this.admin = this.kafka.admin();
  }

  async onModuleDestroy() {
    if (this.connected) {
      await this.admin.disconnect();
      this.connected = false;
    }
  }

  async ensureMainTopic() {
    await this.ensureTopics([
      {
        name: this.config.mainTopic,
        numPartitions: this.config.topicPartitions,
        replicationFactor: this.config.topicReplicationFactor,
      },
    ]);
  }

  async ensureJobTopics(topic: string) {
    await this.ensureTopics(createJobTopicSpecifications(topic));
  }

  async ensureJobTopicsForMany(topics: string[]) {
    const uniqueTopics = Array.from(new Set(topics.filter(Boolean)));

    for (const topic of uniqueTopics) {
      await this.ensureJobTopics(topic);
    }
  }

  async ensureTopics(specifications: KafkaTopicSpecification[]) {
    await this.connectAdmin();

    const existingTopics = new Set(await this.admin.listTopics());
    const missingSpecifications = specifications.filter(({ name }) => !existingTopics.has(name));

    if (missingSpecifications.length === 0) {
      return;
    }

    if (this.config.topicManagementMode === 'validate') {
      throw new Error(
        `Missing Kafka topics: ${missingSpecifications.map(({ name }) => name).join(', ')}. ` +
          'Provision them ahead of time or switch KAFKA_TOPIC_MANAGEMENT_MODE=create_if_missing.',
      );
    }

    await this.admin.createTopics({
      waitForLeaders: true,
      topics: missingSpecifications.map(({ name, numPartitions, replicationFactor }) => ({
        topic: name,
        numPartitions,
        replicationFactor,
      })),
    });

    this.logger.log(
      `Provisioned Kafka topics: ${missingSpecifications.map(({ name }) => name).join(', ')}`,
    );
  }

  private async connectAdmin() {
    if (!this.connected) {
      await this.admin.connect();
      this.connected = true;
    }
  }
}
