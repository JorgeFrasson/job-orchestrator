export type JobPayload = unknown;

export type JobExecutionHandler = (payload: JobPayload) => Promise<void> | void;
export type JobLifecycleHandler = (payload: JobPayload) => Promise<void> | void;
export type JobCommandHandler = (payload: JobPayload) => Promise<void>;
export type JobEventName = 'start' | 'end' | 'fail';
export type KafkaTopicManagementMode = 'validate' | 'create_if_missing';

export interface RegisteredJobDefinition {
  topic: string;
  handler: JobExecutionHandler;
  onStart?: JobLifecycleHandler;
  onFinish?: JobLifecycleHandler;
}

export interface JobRegistrationMessage {
  topic: string;
  service: string;
}

export interface JobOrchestrationOptions {
  kafkaBrokers: string[];
  service: string;
  mainTopic?: string;
  topicManagementMode?: KafkaTopicManagementMode;
  topicPartitions?: number;
  topicReplicationFactor?: number;
}

export interface JobConfig {
  cron?: string;
}

// Backward-compatible aliases for the current public API.
export interface JobDefinition {
  topic: string;
  function: JobExecutionHandler;
  onStart?: JobLifecycleHandler;
  onFinish?: JobLifecycleHandler;
}
