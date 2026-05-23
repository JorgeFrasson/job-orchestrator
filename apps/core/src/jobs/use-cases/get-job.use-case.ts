import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Job } from '../../models/job.model';

@Injectable()
export class GetJobUseCase {
  constructor(@InjectModel(Job) private readonly jobModel: typeof Job) {}

  async execute(topic: string) {
    const job = await this.jobModel.findOne({
      where: { topic },
      include: ['config'],
    });

    if (!job) {
      throw new Error(`Job ${topic} not found`);
    }

    return job;
  }
}
