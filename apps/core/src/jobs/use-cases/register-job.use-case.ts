import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Job } from '../../models/job.model';
import { RegisterJobDto } from '../dto/register-job.dto';
import { JobRegistryService } from '../job-registry.service';
import { JobSchedulerService } from '../job-scheduler.service';

@Injectable()
export class RegisterJobUseCase {
  private readonly logger = new Logger(RegisterJobUseCase.name);

  constructor(
    @InjectModel(Job) private readonly jobModel: typeof Job,
    private readonly registry: JobRegistryService,
    private readonly scheduler: JobSchedulerService,
  ) {}

  async execute(dto: RegisterJobDto) {
    const { topic, service } = dto;

    if (this.registry.has(topic)) {
      this.logger.log(`Job ${topic} is already loaded in memory`);
      return { status: 'already_registered', topic };
    }

    this.logger.log(`Registering job ${topic} from service ${service}`);

    let job = await this.jobModel.findOne({
      where: { topic },
      include: ['config'],
    });

    let isNewJob = !job;

    if (!job) {
      try {
        job = await this.jobModel.create({ topic, service } as Job);
      } catch (error) {
        if (!this.isUniqueTopicViolation(error)) {
          throw error;
        }

        job = await this.jobModel.findOne({
          where: { topic },
          include: ['config'],
        });
        isNewJob = false;
      }
    }

    if (!job) {
      throw new Error(`Failed to register job ${topic}`);
    }

    if (!isNewJob) {
      await job.update({ service });
    }

    this.registry.remember({ topic, service });

    if (!isNewJob && job.config?.cron) {
      await this.scheduler.updateSchedule(topic, job.config.cron);
    }
    this.logger.log(`Job ${topic} registered successfully`);

    return { status: 'ok', topic, isNew: isNewJob };
  }

  private isUniqueTopicViolation(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'SequelizeUniqueConstraintError'
    );
  }
}
