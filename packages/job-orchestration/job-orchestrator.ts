import { OrchestratorConfig } from './config/orchestrator.config';
import { OrchestratorKafkaRuntime } from './kafka/orchestrator-kafka.runtime';
import { OrchestratorTopicProvisioner } from './kafka/topic-provisioner';
import {
  JobExecutionHandler,
  JobLifecycleHandler,
  JobOrchestrationOptions,
  JobRegistrationMessage,
  RegisteredJobDefinition,
} from './types/jobs.types';

class JobExecutionPipeline {
  constructor(
    private readonly topic: string,
    private readonly execute: JobExecutionHandler,
    private readonly onStart?: JobLifecycleHandler,
    private readonly onFinish?: JobLifecycleHandler,
  ) {}

  async run(payload: unknown) {
    try {
      if (this.onStart) {
        await this.onStart(payload);
      }

      await OrchestratorKafkaRuntime.publishLifecycleEvent(this.topic, 'start', payload);
      await this.execute(payload);

      if (this.onFinish) {
        await this.onFinish(payload);
      }

      await OrchestratorKafkaRuntime.publishLifecycleEvent(this.topic, 'end', payload);
    } catch (error) {
      await OrchestratorKafkaRuntime.publishLifecycleEvent(this.topic, 'fail', {
        ...(payload && typeof payload === 'object' ? payload : { payload }),
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

export class JobOrchestratorSetup {
  static init(config: JobOrchestrationOptions) {
    OrchestratorConfig.init(config);
  }
}

export class JobOrchestrator {
  static async register(job: RegisteredJobDefinition) {
    const registrationMessage = this.createRegistrationMessage(job);
    const pipeline = new JobExecutionPipeline(
      job.topic,
      job.handler,
      job.onStart,
      job.onFinish,
    );

    await OrchestratorTopicProvisioner.ensureMainTopic();
    await OrchestratorKafkaRuntime.publishRegistration(registrationMessage);
    await OrchestratorTopicProvisioner.ensureJobTopics(job.topic);
    await OrchestratorKafkaRuntime.subscribeToJobTopic(job.topic, async (payload) => {
      await pipeline.run(payload);
    });
  }

  static async Job(job: RegisteredJobDefinition) {
    await this.register(job);
  }

  private static createRegistrationMessage(job: RegisteredJobDefinition): JobRegistrationMessage {
    return {
      topic: job.topic,
      service: OrchestratorConfig.getOptions().service,
    };
  }
}
