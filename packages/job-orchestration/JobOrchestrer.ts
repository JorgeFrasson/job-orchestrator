import { JobOrchestrator, JobOrchestratorSetup } from './job-orchestrator';
import { JobDefinition } from './types/jobs.types';

export class JobOrchestrerSetup extends JobOrchestratorSetup {}

export class JobOrchestrer {
  static async Job(job: JobDefinition) {
    await JobOrchestrator.register({
      topic: job.topic,
      handler: job.function,
      onStart: job.onStart,
      onFinish: job.onFinish,
    });
  }
}
