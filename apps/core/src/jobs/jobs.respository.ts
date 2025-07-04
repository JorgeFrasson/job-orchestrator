import { Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { JobConfig } from "src/models/job-config.model";
import { Job } from "src/models/job.model";

export class JobsRepository {
  constructor(
    @InjectModel(Job) private jobModel: typeof Job,
    @InjectModel(JobConfig) private jobConfigModel: typeof JobConfig,
  ) {}

  private readonly logger = new Logger(JobsRepository.name);

  async findJobByTopic(topic: string) {
    let query = await this.jobModel.findOne({ where: { topic } });
    
    if (!query) {
      throw new NotFoundException('Job not found');
    }
    
    return query?.toJSON();
  }

  async findJobConfigByJobId(jobId: number) {
    let query = await this.jobConfigModel.findOne({ where: { jobId } });
    
    if (!query) {
      throw new NotFoundException('JobConfig not found');
    }
    
    return query?.toJSON();
  }

  async findAllJobs() {
    const query = await this.jobModel.findAll();
    return query?.map((job) => job.toJSON());
  }

  async findAllJobConfigs() {
    const query = await this.jobConfigModel.findAll();
    return query?.map((jobConfig) => jobConfig.toJSON());
  }
}