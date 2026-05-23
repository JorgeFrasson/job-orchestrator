import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Job } from '../../models/job.model';

@Injectable()
export class ListJobsUseCase {
  constructor(@InjectModel(Job) private readonly jobModel: typeof Job) {}

  async execute() {
    return this.jobModel.findAll({
      include: ['config'],
      order: [['createdAt', 'DESC']],
    });
  }
}
