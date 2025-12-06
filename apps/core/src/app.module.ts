import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { JobsController } from './jobs/jobs.controller';
import { JobsService } from './jobs/jobs.service';
import { JobConsumerService } from './jobs/jobs-consumer.service';
import { JobProducerService } from './jobs/jobs-producer.service';
import { JobLifecycleConsumerService } from './jobs/job-lifecycle-consumer.service';
import { JobSchedulerService } from './jobs/job-scheduler.service';
import { Job } from './models/job.model';
import { JobConfig } from './models/job-config.model';

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
    JobSchedulerService,
  ],
})
export class AppModule {}