export type KafkaTopicManagementMode = 'validate' | 'create_if_missing';

export interface KafkaTopicSpecification {
  name: string;
  numPartitions: number;
  replicationFactor: number;
}

export interface KafkaCoreConfig {
  brokers: string[];
  clientId: string;
  mainTopic: string;
  topicManagementMode: KafkaTopicManagementMode;
  topicPartitions: number;
  topicReplicationFactor: number;
}

function readNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function readBrokers(): string[] {
  const raw = process.env.KAFKA_BROKERS || process.env.KAFKA_BROKER || 'kafka:29092';
  return raw
    .split(',')
    .map((broker) => broker.trim())
    .filter(Boolean);
}

export function getKafkaCoreConfig(): KafkaCoreConfig {
  return {
    brokers: readBrokers(),
    clientId: process.env.KAFKA_CLIENT_ID || 'job-orchestrator-core',
    mainTopic: process.env.KAFKA_MAIN_TOPIC || 'job-orchestrer-main',
    topicManagementMode:
      process.env.KAFKA_TOPIC_MANAGEMENT_MODE === 'create_if_missing'
        ? 'create_if_missing'
        : 'validate',
    topicPartitions: readNumber(process.env.KAFKA_TOPIC_PARTITIONS, 1),
    topicReplicationFactor: readNumber(process.env.KAFKA_TOPIC_REPLICATION_FACTOR, 1),
  };
}

export function createJobTopicSpecifications(topic: string): KafkaTopicSpecification[] {
  const { topicPartitions, topicReplicationFactor } = getKafkaCoreConfig();

  return [
    topic,
    `${topic}-start`,
    `${topic}-end`,
    `${topic}-fail`,
  ].map((name) => ({
    name,
    numPartitions: topicPartitions,
    replicationFactor: topicReplicationFactor,
  }));
}
