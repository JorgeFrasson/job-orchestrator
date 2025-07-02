import { JobDefinition, JobOrchestrationOptions } from './types/jobs.types';
import { OrchestratorConfig } from './config/orchestrator.config';
import { sendJobToCore } from './kafka/kafka.producer';
import { createJobConsumer } from './kafka/kafka.consumer';
import { publishJobStart, publishJobEnd } from './kafka/kafka.job-events';

export class JobOrchestrerSetup {
  static init(config: JobOrchestrationOptions) {
    OrchestratorConfig.init(config);
  }
}

export class JobOrchestrer {
  static async Job(job: JobDefinition) {
    await sendJobToCore(job);
    await createJobConsumer(job.topic, async (payload: any) => {
      if (job.onStart) await job.onStart(payload);
      await publishJobStart(job.topic, payload);
      await job.function(payload);
      if (job.onFinish) await job.onFinish(payload);
      await publishJobEnd(job.topic, payload);
    });
  }
}