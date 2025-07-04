import { Controller, Post, Param, Body, Patch, Get, Put } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { JobsService } from './jobs.service';
import { RegisterJobDto } from './dto/register-job.dto';
import { JobProducerService } from './jobs-producer.service';
import { UpdateJobConfigDto } from './dto/update-job-config.dto';

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

  @Put('/jobs/:topic/config')
  async updateJobConfig(
    @Param('topic') topic: string,
    @Body() dto: UpdateJobConfigDto
  ) {
    return this.jobsService.updateJobConfig(topic, dto);
  }

  @Get('/jobs/:topic/config')
  async getJobConfig(
    @Param('topic') topic: string
  ) {
    return this.jobsService.getJobConfig(topic);
  }
}