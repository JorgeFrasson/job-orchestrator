import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Job } from '../models/job.model';
import { JobExecution } from '../models/job-execution.model';

type LifecycleEvent = 'start' | 'end' | 'fail';

@Injectable()
export class JobExecutionHistoryService {
  constructor(
    @InjectModel(Job) private readonly jobModel: typeof Job,
    @InjectModel(JobExecution) private readonly jobExecutionModel: typeof JobExecution,
  ) {}

  async recordLifecycleEvent(topic: string, event: LifecycleEvent, payload: any) {
    const job = await this.jobModel.findOne({ where: { topic } });

    if (!job) {
      throw new Error(`Job ${topic} not found while recording execution history`);
    }

    const executionId = this.resolveExecutionId(payload);
    const triggerPayload = payload?.payload ?? payload;
    const lifecyclePayload = payload ?? null;

    const existingExecution = await this.jobExecutionModel.findOne({
      where: { executionId },
    });

    if (event === 'start') {
      if (existingExecution) {
        return existingExecution.update({
          status: 'running',
          startedAt: this.resolveEventDate(payload),
          triggerPayload,
          lifecyclePayload,
          errorMessage: null,
        });
      }

      return this.createOrLoadExecution({
        executionId,
        status: 'running',
        startedAt: this.resolveEventDate(payload),
        finishedAt: null,
        triggerPayload,
        lifecyclePayload,
        errorMessage: null,
        jobId: job.id,
      } as JobExecution);
    }

    if (!existingExecution) {
      const createdOrLoadedExecution = await this.createOrLoadExecution({
        executionId,
        status: event === 'fail' ? 'failed' : 'succeeded',
        startedAt: this.resolveEventDate(payload),
        finishedAt: this.resolveEventDate(payload),
        triggerPayload,
        lifecyclePayload,
        errorMessage: payload?.errorMessage || null,
        jobId: job.id,
      } as JobExecution);

      if (createdOrLoadedExecution.status === 'running') {
        return createdOrLoadedExecution.update({
          status: event === 'fail' ? 'failed' : 'succeeded',
          finishedAt: this.resolveEventDate(payload),
          lifecyclePayload,
          errorMessage: payload?.errorMessage || null,
        });
      }

      return createdOrLoadedExecution;
    }

    return existingExecution.update({
      status: event === 'fail' ? 'failed' : 'succeeded',
      finishedAt: this.resolveEventDate(payload),
      lifecyclePayload,
      errorMessage: payload?.errorMessage || null,
    });
  }

  async listExecutions(topic: string) {
    const job = await this.jobModel.findOne({ where: { topic } });

    if (!job) {
      throw new Error(`Job ${topic} not found`);
    }

    return this.jobExecutionModel.findAll({
      where: { jobId: job.id },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
  }

  private resolveExecutionId(payload: any) {
    return payload?.executionId || `legacy-${payload?.timestamp || Date.now()}`;
  }

  private resolveEventDate(payload: any) {
    return payload?.timestamp ? new Date(payload.timestamp) : new Date();
  }

  private async createOrLoadExecution(payload: JobExecution) {
    try {
      return await this.jobExecutionModel.create(payload);
    } catch (error) {
      if (!this.isUniqueExecutionViolation(error)) {
        throw error;
      }

      const existingExecution = await this.jobExecutionModel.findOne({
        where: { executionId: payload.executionId },
      });

      if (!existingExecution) {
        throw error;
      }

      return existingExecution;
    }
  }

  private isUniqueExecutionViolation(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'SequelizeUniqueConstraintError'
    );
  }
}
