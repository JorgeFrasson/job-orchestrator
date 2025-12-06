import { Controller, Post, Get, Patch, Param, Body } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { JobsService } from './jobs.service';
import { RegisterJobDto } from './dto/register-job.dto';
import { JobProducerService } from './jobs-producer.service';

@Controller()
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly jobProducer: JobProducerService
  ) {}

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

  @Post('/jobs/:topic/start')
  async startJob(
    @Param('topic') topic: string,
    @Body() payload: any
  ) {
    await this.jobProducer.registerProducerForTopic(topic);
    await this.jobProducer.sendToJobTopic(topic, {
      command: 'start',
      timestamp: Date.now(),
      payload,
    });
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