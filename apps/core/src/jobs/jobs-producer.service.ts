import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { getKafkaCoreConfig } from '../kafka/kafka.config';

@Injectable()
export class JobProducerService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producers: Map<string, Producer> = new Map();

  async onModuleInit() {
    const kafkaConfig = getKafkaCoreConfig();
    this.kafka = new Kafka({
      clientId: `${kafkaConfig.clientId}-producer`,
      brokers: kafkaConfig.brokers,
    });
  }

  async onModuleDestroy() {
    for (const producer of this.producers.values()) {
      await producer.disconnect();
    }
  }

  async registerProducerForTopic(topic: string) {
    if (!this.producers.has(topic)) {
      const producer = this.kafka.producer();
      await producer.connect();
      this.producers.set(topic, producer);
      console.log(`[Kafka] Producer registered for topic: ${topic}`);
    }
  }

  async sendToJobTopic(topic: string, message: any) {
    const producer = this.producers.get(topic);
    if (!producer) {
      throw new Error(`No producer registered for topic ${topic}`);
    }

    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });

    console.log(`[Kafka] Sent message to ${topic}:`, message);
  }
}
