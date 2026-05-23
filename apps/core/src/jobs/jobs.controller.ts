import { Controller, Post, Get, Patch, Param, Body } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { JobsService } from './jobs.service';
import { RegisterJobDto } from './dto/register-job.dto';

@Controller()
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @MessagePattern('job-orchestrer-main')
  handleJobRegister(
    @Payload() data: RegisterJobDto
  ) {
    console.log(data);
    return this.jobsService.handleJobRegistration(data);
  }

  @Get('/jobs')
  async listJobs() {
    return this.jobsService.getAllJobs();
  }

  @Get('/jobs/:topic')
  async getJob(@Param('topic') topic: string) {
    return this.jobsService.getJob(topic);
  }

  @Get('/jobs/:topic/executions')
  async listExecutions(@Param('topic') topic: string) {
    return this.jobsService.listExecutions(topic);
  }

  @Post('/jobs/:topic/start')
  async startJob(
    @Param('topic') topic: string,
    @Body() payload: any
  ) {
    const executionPayload = payload?.payload ?? payload ?? {};

    await this.jobsService.triggerJobManually(topic, executionPayload);
    return { status: 'started', topic, sent: true };
  }

  @Patch('/jobs/:topic/config')
  async updateJobConfig(
    @Param('topic') topic: string,
    @Body() config: any
  ) {
    return this.jobsService.updateJobConfig(topic, config);
  }
}
