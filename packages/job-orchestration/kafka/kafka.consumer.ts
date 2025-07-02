import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { OrchestratorConfig } from '../config/orchestrator.config';

const consumers: Record<string, Consumer> = {};

export async function createJobConsumer(topic: string, onMessage: (payload: any) => Promise<void>) {
  if (consumers[topic]) return; // Não criar dois consumers para o mesmo tópico
  const { kafkaBrokers, service } = OrchestratorConfig.getOptions();
  const kafka = new Kafka({ brokers: kafkaBrokers });
  const consumer = kafka.consumer({ groupId: `${service}-${topic}-group` });
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }: EachMessagePayload) => {
      let payload: string | undefined = undefined;
      try {
        payload = message.value ? JSON.parse(message.value.toString()) : undefined;
      } catch (e) {
        payload = message.value?.toString();
      }
      await onMessage(payload);
    }
  });
  consumers[topic] = consumer;
}
