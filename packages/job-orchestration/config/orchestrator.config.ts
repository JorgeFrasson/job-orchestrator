import { JobOrchestrationOptions } from '../types/jobs.types';

export class OrchestratorConfig {
  private static options: JobOrchestrationOptions;

  static init(opts: JobOrchestrationOptions) {
    OrchestratorConfig.options = opts;
  }

  static getOptions(): JobOrchestrationOptions {
    if (!OrchestratorConfig.options) throw new Error('Orchestrator not initialized');
    return OrchestratorConfig.options;
  }
}