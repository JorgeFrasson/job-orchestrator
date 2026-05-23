import { Injectable } from '@nestjs/common';

export interface RegisteredJobSummary {
  topic: string;
  service: string;
}

@Injectable()
export class JobRegistryService {
  private readonly jobsByTopic = new Map<string, RegisteredJobSummary>();

  has(topic: string): boolean {
    return this.jobsByTopic.has(topic);
  }

  remember(job: RegisteredJobSummary) {
    this.jobsByTopic.set(job.topic, job);
  }

  rememberMany(jobs: RegisteredJobSummary[]) {
    for (const job of jobs) {
      this.remember(job);
    }
  }

  list(): RegisteredJobSummary[] {
    return Array.from(this.jobsByTopic.values());
  }
}
