import { Injectable } from '@nestjs/common';
import { JobRegistryService } from '../job-registry.service';
import { JobRuntimeService } from '../job-runtime.service';

@Injectable()
export class TriggerJobManuallyUseCase {
  constructor(
    private readonly registry: JobRegistryService,
    private readonly runtime: JobRuntimeService,
  ) {}

  async execute(topic: string, payload: unknown = {}) {
    if (!this.registry.has(topic)) {
      throw new Error(`Job ${topic} is not registered`);
    }

    await this.runtime.startJob(topic, payload);
  }
}
