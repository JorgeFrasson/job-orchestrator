import { Injectable, Logger } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';

@Injectable()
export class JobLifecycleConsumerService {
  private kafka: Kafka;
  private consumers: Map<string, Consumer> = new Map();
  private readonly logger = new Logger(JobLifecycleConsumerService.name);

  constructor() {
    this.kafka = new Kafka({
      clientId: 'core-lifecycle',
      brokers: ['kafka:29092'], // ajuste conforme necessário
    });
  }

  async registerLifecycleConsumersForJob(topic: string) {
    await this.createConsumer(`${topic}-start`, (payload) => {
      this.logger.log(`[${topic}-start] Job started: ${JSON.stringify(payload)}`);
      // Aqui pode atualizar status, acionar lógica, etc.
    });
    await this.createConsumer(`${topic}-end`, (payload) => {
      this.logger.log(`[${topic}-end] Job finished: ${JSON.stringify(payload)}`);
      // Aqui pode atualizar status, acionar lógica, etc.
    });
  }

  private async createConsumer(topic: string, onMessage: (payload: any) => void) {
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
        onMessage(payload);
      }
    });
    this.consumers.set(topic, consumer);
    this.logger.log(`Consumer registered for topic: ${topic}`);
  }
}
