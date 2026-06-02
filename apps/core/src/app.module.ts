import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { getDatabaseConfig } from './database/database.config';
import { JobsController } from './jobs/jobs.controller';
import { JobsService } from './jobs/jobs.service';
import { JobSchedulerService } from './jobs/job-scheduler.service';
import { JobIntegrationsService } from './jobs/job-integrations.service';
import { JobExecutionHistoryService } from './jobs/job-execution-history.service';
import { JobRegistryService } from './jobs/job-registry.service';
import { JobRuntimeService } from './jobs/job-runtime.service';
import { LoadExistingJobsUseCase } from './jobs/use-cases/load-existing-jobs.use-case';
import { RegisterJobUseCase } from './jobs/use-cases/register-job.use-case';
import { ListJobsUseCase } from './jobs/use-cases/list-jobs.use-case';
import { GetJobUseCase } from './jobs/use-cases/get-job.use-case';
import { UpdateJobConfigUseCase } from './jobs/use-cases/update-job-config.use-case';
import { TriggerJobManuallyUseCase } from './jobs/use-cases/trigger-job-manually.use-case';
import { Job } from './models/job.model';
import { JobConfig } from './models/job-config.model';
import { JobExecution } from './models/job-execution.model';
import { WebSocketJobGatewayService } from './transport/websocket-job-gateway.service';

@Module({
  imports: [
    SequelizeModule.forRoot(getDatabaseConfig()),
    SequelizeModule.forFeature([Job, JobConfig, JobExecution]),
  ],
  controllers: [JobsController],
  providers: [
    JobsService,
    JobSchedulerService,
    JobIntegrationsService,
    JobExecutionHistoryService,
    JobRegistryService,
    JobRuntimeService,
    WebSocketJobGatewayService,
    LoadExistingJobsUseCase,
    RegisterJobUseCase,
    ListJobsUseCase,
    GetJobUseCase,
    UpdateJobConfigUseCase,
    TriggerJobManuallyUseCase,
  ],
})
export class AppModule {}
