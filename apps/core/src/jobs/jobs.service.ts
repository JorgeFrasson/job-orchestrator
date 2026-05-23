import { Injectable, OnModuleInit } from '@nestjs/common';
import { RegisterJobDto } from './dto/register-job.dto';
import { LoadExistingJobsUseCase } from './use-cases/load-existing-jobs.use-case';
import { RegisterJobUseCase } from './use-cases/register-job.use-case';
import { ListJobsUseCase } from './use-cases/list-jobs.use-case';
import { GetJobUseCase } from './use-cases/get-job.use-case';
import { UpdateJobConfigUseCase } from './use-cases/update-job-config.use-case';
import { TriggerJobManuallyUseCase } from './use-cases/trigger-job-manually.use-case';
import { JobRegistryService } from './job-registry.service';
import { JobConfig } from '../models/job-config.model';
import { JobExecutionHistoryService } from './job-execution-history.service';

@Injectable()
export class JobsService implements OnModuleInit {
  constructor(
    private readonly loadExistingJobsUseCase: LoadExistingJobsUseCase,
    private readonly registerJobUseCase: RegisterJobUseCase,
    private readonly listJobsUseCase: ListJobsUseCase,
    private readonly getJobUseCase: GetJobUseCase,
    private readonly updateJobConfigUseCase: UpdateJobConfigUseCase,
    private readonly triggerJobManuallyUseCase: TriggerJobManuallyUseCase,
    private readonly registry: JobRegistryService,
    private readonly executionHistoryService: JobExecutionHistoryService,
  ) {}

  async onModuleInit() {
    setTimeout(() => {
      void this.loadExistingJobsUseCase.execute();
    }, 1000);
  }

  async handleJobRegistration(dto: RegisterJobDto) {
    return this.registerJobUseCase.execute(dto);
  }

  listJobs() {
    return this.registry.list();
  }

  async getAllJobs() {
    return this.listJobsUseCase.execute();
  }

  async getJob(topic: string) {
    return this.getJobUseCase.execute(topic);
  }

  async updateJobConfig(topic: string, configData: Partial<JobConfig>) {
    return this.updateJobConfigUseCase.execute(topic, configData);
  }

  async triggerJobManually(topic: string, payload = {}) {
    await this.triggerJobManuallyUseCase.execute(topic, payload);
  }

  async listExecutions(topic: string) {
    return this.executionHistoryService.listExecutions(topic);
  }
}
