import { Consumer, EachMessagePayload, Kafka, Producer } from 'kafkajs';
import { OrchestratorConfig } from '../config/orchestrator.config';
import {
  JobCommandHandler,
  JobEventName,
  JobRegistrationMessage,
} from '../types/jobs.types';

export class OrchestratorKafkaRuntime {
  private static producer: Producer | undefined;
  private static producerConnection: Promise<Producer> | undefined;
  private static consumersByTopic = new Map<string, Consumer>();

  static async publishRegistration(message: JobRegistrationMessage) {
    const { mainTopic } = OrchestratorConfig.getOptions();
    await this.publish(mainTopic, message, message.topic);
  }

  static async publishLifecycleEvent(topic: string, event: JobEventName, payload: unknown) {
    const executionId =
      payload && typeof payload === 'object' && 'executionId' in payload
        ? (payload as { executionId?: string }).executionId
        : undefined;

    await this.publish(`${topic}-${event}`, {
      event,
      timestamp: Date.now(),
      executionId,
      payload,
    });
  }

  static async subscribeToJobTopic(topic: string, handler: JobCommandHandler) {
    if (this.consumersByTopic.has(topic)) {
      return;
    }

    const { service } = OrchestratorConfig.getOptions();
    const consumer = this.createKafkaClient().consumer({
      groupId: `${service}-${topic}-group`,
    });

    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });
    await consumer.run({
      eachMessage: async (messageContext: EachMessagePayload) => {
        await handler(this.parseMessage(messageContext));
      },
    });

    this.consumersByTopic.set(topic, consumer);
  }

  private static async publish(topic: string, message: unknown, key?: string) {
    const producer = await this.getProducer();
    await producer.send({
      topic,
      messages: [
        {
          key,
          value: JSON.stringify(message),
        },
      ],
    });
  }

  private static async getProducer() {
    if (!this.producer) {
      if (!this.producerConnection) {
        this.producerConnection = this.connectProducer();
      }

      this.producer = await this.producerConnection;
    }

    return this.producer;
  }

  private static async connectProducer() {
    const producer = this.createKafkaClient().producer();

    try {
      await producer.connect();
      return producer;
    } catch (error) {
      this.producerConnection = undefined;
      throw error;
    }
  }

  private static createKafkaClient() {
    const { kafkaBrokers } = OrchestratorConfig.getOptions();
    return new Kafka({ brokers: kafkaBrokers });
  }

  private static parseMessage({ message }: EachMessagePayload): unknown {
    if (!message.value) {
      return undefined;
    }

    const rawValue = message.value.toString();

    try {
      return JSON.parse(rawValue);
    } catch {
      return rawValue;
    }
  }

  // Test-only hook to isolate static Kafka runtime state between cases.
  static resetForTests() {
    this.producer = undefined;
    this.producerConnection = undefined;
    this.consumersByTopic = new Map<string, Consumer>();
  }
}
