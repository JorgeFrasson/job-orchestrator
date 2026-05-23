import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Job } from '../../models/job.model';
import { JobRegistryService } from '../job-registry.service';

@Injectable()
export class LoadExistingJobsUseCase {
  private readonly logger = new Logger(LoadExistingJobsUseCase.name);

  constructor(
    @InjectModel(Job) private readonly jobModel: typeof Job,
    private readonly registry: JobRegistryService,
  ) {}

  async execute() {
    this.logger.log('Loading registered jobs from the database');

    const existingJobs = await this.jobModel.findAll({
      include: [
        {
          association: 'config',
          required: false,
        },
      ],
      raw: false,
    });

    this.registry.rememberMany(
      existingJobs.map((job) => ({
        topic: job.topic,
        service: job.service,
      })),
    );

    this.logger.log(`Loaded ${existingJobs.length} jobs into the in-memory registry`);
    return existingJobs.length;
  }
}
