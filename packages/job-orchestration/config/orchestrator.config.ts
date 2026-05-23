import { JobOrchestrationOptions } from '../types/jobs.types';

export class OrchestratorConfig {
  private static options: JobOrchestrationOptions;

  static init(opts: JobOrchestrationOptions) {
    OrchestratorConfig.options = {
      ...opts,
      mainTopic: opts.mainTopic || 'job-orchestrer-main',
      topicManagementMode: opts.topicManagementMode || 'validate',
      topicPartitions: opts.topicPartitions || 1,
      topicReplicationFactor: opts.topicReplicationFactor || 1,
    };
  }

  static getOptions(): JobOrchestrationOptions {
    if (!OrchestratorConfig.options) {
      throw new Error('JobOrchestrator has not been initialized yet');
    }

    return OrchestratorConfig.options;
  }

  // Test-only hook to isolate static state between cases.
  static resetForTests() {
    OrchestratorConfig.options = undefined as never;
  }
}
