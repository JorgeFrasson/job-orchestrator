import { JobOrchestrationOptions } from '../types/jobs.types';

export class OrchestratorConfig {
  private static options: JobOrchestrationOptions;

  static init(opts: JobOrchestrationOptions) {
    OrchestratorConfig.options = {
      ...opts,
      coreUrl: normalizeCoreUrl(opts.coreUrl || 'ws://localhost:3000'),
      reconnectIntervalMs: opts.reconnectIntervalMs || 3000,
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

function normalizeCoreUrl(raw: string) {
  if (raw.startsWith('http://')) {
    return raw.replace('http://', 'ws://');
  }

  if (raw.startsWith('https://')) {
    return raw.replace('https://', 'wss://');
  }

  return raw;
}
