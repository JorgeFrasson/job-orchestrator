import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Job } from '../../models/job.model';
import { JobConfig } from '../../models/job-config.model';
import { JobSchedulerService } from '../job-scheduler.service';

@Injectable()
export class UpdateJobConfigUseCase {
  private readonly logger = new Logger(UpdateJobConfigUseCase.name);

  constructor(
    @InjectModel(Job) private readonly jobModel: typeof Job,
    @InjectModel(JobConfig) private readonly jobConfigModel: typeof JobConfig,
    private readonly scheduler: JobSchedulerService,
  ) {}

  async execute(topic: string, configData: Partial<JobConfig>) {
    const job = await this.jobModel.findOne({
      where: { topic },
      include: ['config'],
    });

    if (!job) {
      throw new Error(`Job ${topic} not found`);
    }

    const existingConfig = await this.jobConfigModel.findOne({
      where: { jobId: job.id },
      order: [['id', 'DESC']],
    });

    if (existingConfig) {
      await existingConfig.update(configData);
    } else {
      await this.jobConfigModel.create({
        ...configData,
        jobId: job.id,
      } as JobConfig);
    }

    if (configData.cron !== undefined) {
      await this.scheduler.updateSchedule(topic, configData.cron);
      this.logger.log(`Updated schedule for ${topic}: ${configData.cron || 'removed'}`);
    }

    return this.jobModel.findOne({
      where: { topic },
      include: ['config'],
    });
  }
}
