import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class JobProducerService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producers: Map<string, Producer> = new Map();

  async onModuleInit() {
    this.kafka = new Kafka({
      clientId: 'core',
      brokers: ['kafka:29092'], // substitua conforme necessário
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