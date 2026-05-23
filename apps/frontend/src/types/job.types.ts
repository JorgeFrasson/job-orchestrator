export interface Job {
  id: number;
  topic: string;
  service: string;
  serviceName?: string; // Alias for service (backward compatibility)
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
  config?: JobConfig;
}

export interface JobExecution {
  id: number;
  executionId: string;
  status: 'running' | 'succeeded' | 'failed';
  triggerPayload?: unknown;
  lifecyclePayload?: unknown;
  startedAt?: string | null;
  finishedAt?: string | null;
  errorMessage?: string | null;
  jobId: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobConfig {
  id: number;
  cron?: string;
  dependsOn?: string[];
  retries?: number;
  timeout?: number;
  integrations?: Integration[];
  jobId: number;
}

export interface JobStartPayload {
  payload?: any;
}

export interface JobStartResponse {
  status: string;
  topic: string;
  sent: boolean;
}

export type IntegrationType = 'lambda' | 'webhook';

export interface Integration {
  id: string;
  type: IntegrationType;
  event: 'onStart' | 'onFinish';
  config: LambdaIntegration | WebhookIntegration;
}

export interface LambdaIntegration {
  code: string;
}

export interface WebhookIntegration {
  url: string;
  method: 'POST' | 'GET' | 'PUT';
  headers?: Record<string, string>;
  payload?: string;
}
