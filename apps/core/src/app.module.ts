import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { JobsController } from './jobs/jobs.controller';
import { JobsService } from './jobs/jobs.service';
import { JobConsumerService } from './jobs/jobs-consumer.service';
import { JobProducerService } from './jobs/jobs-producer.service';
import { JobLifecycleConsumerService } from './jobs/job-lifecycle-consumer.service';
import { OnModuleInit } from '@nestjs/common';
import { Job } from './models/job.model';
import { JobConfig } from './models/job-config.model';
import { JobTriggerManagerService } from './jobs/job-trigger-manager.service';
import { JobsRepository } from './jobs/jobs.respository';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      models: [Job, JobConfig],
      autoLoadModels: true,
      synchronize: true,
      logging: false,
    }),
    SequelizeModule.forFeature([Job, JobConfig]),
  ],
  controllers: [JobsController],
  providers: [
    JobsService,
    JobConsumerService,
    JobProducerService,
    JobLifecycleConsumerService,
    JobTriggerManagerService,
    JobsRepository
  ],
})
export class AppModule {}