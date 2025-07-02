export interface JobConfig {
  cron?: string;
  // futuros triggers: event, httpTrigger, etc.
}

export interface JobDefinition {
  topic: string;
  function: (payload: any) => Promise<void> | void;
  onStart?: (payload: any) => Promise<void> | void;
  onFinish?: (payload: any) => Promise<void> | void;
}

export interface JobOrchestrationOptions {
  kafkaBrokers: string[];
  service: string;
  mainTopic?: string;
}