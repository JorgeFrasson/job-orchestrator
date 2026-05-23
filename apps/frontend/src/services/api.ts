import type {
  Integration,
  Job,
  JobExecution,
  JobStartPayload,
  JobStartResponse,
} from '../types/job.types';

interface JobConfig {
  cron?: string;
  dependsOn?: string[];
  retries?: number;
  timeout?: number;
  integrations?: Integration[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiService {
  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getJobs(): Promise<Job[]> {
    return this.fetch<Job[]>('/jobs');
  }

  async getJob(topic: string): Promise<Job> {
    return this.fetch<Job>(`/jobs/${topic}`);
  }

  async getJobExecutions(topic: string): Promise<JobExecution[]> {
    return this.fetch<JobExecution[]>(`/jobs/${topic}/executions`);
  }

  async startJob(topic: string, payload: JobStartPayload = {}): Promise<JobStartResponse> {
    return this.fetch<JobStartResponse>(`/jobs/${topic}/start`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateJobConfig(topic: string, config: Partial<JobConfig>): Promise<Job> {
    return this.fetch<Job>(`/jobs/${topic}/config`, {
      method: 'PATCH',
      body: JSON.stringify(config),
    });
  }
}

export const apiService = new ApiService();
