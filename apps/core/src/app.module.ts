import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TopicProvisioningService } from './kafka/topic-provisioning.service';
import { JobsController } from './jobs/jobs.controller';
import { JobsService } from './jobs/jobs.service';
import { JobConsumerService } from './jobs/jobs-consumer.service';
import { JobProducerService } from './jobs/jobs-producer.service';
import { JobLifecycleConsumerService } from './jobs/job-lifecycle-consumer.service';
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

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      models: [Job, JobConfig, JobExecution],
      autoLoadModels: true,
      synchronize: true,
      logging: false,
    }),
    SequelizeModule.forFeature([Job, JobConfig, JobExecution]),
  ],
  controllers: [JobsController],
  providers: [
    JobsService,
    JobConsumerService,
    JobProducerService,
    JobLifecycleConsumerService,
    JobSchedulerService,
    JobIntegrationsService,
    JobExecutionHistoryService,
    JobRegistryService,
    JobRuntimeService,
    LoadExistingJobsUseCase,
    RegisterJobUseCase,
    ListJobsUseCase,
    GetJobUseCase,
    UpdateJobConfigUseCase,
    TriggerJobManuallyUseCase,
    TopicProvisioningService,
  ],
})
export class AppModule {}
