import { Kafka, Producer } from 'kafkajs';
import { OrchestratorConfig } from '../config/orchestrator.config';
import { JobDefinition } from '../types/jobs.types';

let producer: Producer;

export async function initKafkaProducer() {
  const { kafkaBrokers } = OrchestratorConfig.getOptions();
  const kafka = new Kafka({ brokers: kafkaBrokers });
  producer = kafka.producer();
  await producer.connect();
}

export async function sendJobToCore(job: JobDefinition) {
  const { mainTopic = 'job-orchestrer-main', service } = OrchestratorConfig.getOptions();
  if (!producer) await initKafkaProducer();

  await producer.send({
    topic: mainTopic,
    messages: [
      {
        key: job.topic,
        value: JSON.stringify({ ...job, service }),
      },
    ],
  });
}

export async function sendJobEvent(topic: string, message: any) {
  if (!producer) await initKafkaProducer();
  await producer.send({
    topic,
    messages: [
      {
        value: JSON.stringify(message),
      },
    ],
  });
}