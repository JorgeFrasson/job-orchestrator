// src/jobs/jobs.service.ts
import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RegisterJobDto } from './dto/register-job.dto';
import { JobProducerService } from './jobs-producer.service';
import { JobConsumerService } from './jobs-consumer.service';
import { JobLifecycleConsumerService } from './job-lifecycle-consumer.service';
import { Job } from '../models/job.model';
import * as cron from 'node-cron';
import { UpdateJobConfigDto } from './dto/update-job-config.dto';
import { JobConfig } from 'src/models/job-config.model';
import { JobTriggerManagerService } from './job-trigger-manager.service';
import { JobTriggerCallback } from './dto/job-trigger-callback.dto';
import { JobsRepository } from './jobs.respository';

// interface JobEntry removida: configuração agora é apenas no core via HTTP

@Injectable()
export class JobsService implements OnModuleInit {
  
  constructor(
    private readonly producer: JobProducerService,
    private readonly consumer: JobConsumerService,
    private readonly jobLifecycleConsumerService: JobLifecycleConsumerService,
    @InjectModel(Job) private jobModel: typeof Job,
    @InjectModel(JobConfig) private jobConfigModel: typeof JobConfig,
    private readonly jobTriggerManager: JobTriggerManagerService,
    private readonly jobRepository: JobsRepository,
  ) {}

  private readonly logger = new Logger(JobsService.name);
  private jobs = new Map<string, { topic: string; service: string }>();
  
  /**
   * Método chamado após inicialização do módulo
   * Registra o callback de disparo no JobTriggerManager
   */
  async onModuleInit() {
    this.logger.log('Registrando callback de disparo de jobs');
    
    // Configurando o callback que será chamado pelo JobTriggerManager
    this.jobTriggerManager.setJobTriggerCallback(async (topic, reason, payload = {}) => {
      this.logger.log(`Job '${topic}' sendo disparado via trigger: ${reason}`);
      await this.triggerJobManually(topic, { reason, ...payload });
    });
    
    // Inicializa todos os triggers a partir do banco
    await this.initializeAllTriggersFromDb();
  }

  /** Chamado quando o SDK publica no tópico principal */
  async handleJobRegistration(dto: RegisterJobDto) {
    const topic = dto.topic;
    const service = dto.service;

    // 1) Registra Producer e Consumer
    await this.producer.registerProducerForTopic(topic);
    await this.consumer.registerConsumerForJob(topic, async (payload) => {
      this.logger.log(`CMD recebido em ${topic}: ${JSON.stringify(payload)}`);
      // ex: await this.myUseCase.execute(payload);
    });

    // Registra os consumers de lifecycle para <topic>-start e <topic>-end
    await this.jobLifecycleConsumerService.registerLifecycleConsumersForJob(topic);

    // 2) Persiste o Job no banco (ignora config)
    let job = await this.jobModel.findOne({ where: { topic } });
    if (!job) {
      job = await this.jobModel.create({
        topic: topic,
        service: service
      } as any);
    } else {
      await job.update({ service });
    }

    // 3) Armazena estado atualizado (em memória, opcional)
    this.jobs.set(topic, { topic, service });

    // 4) Confirma registro para o job
    await this.producer.sendToJobTopic(topic, {
      event: 'JOB_REGISTERED',
      timestamp: Date.now(),
    });

    // Atualiza triggers caso já exista config
    const config = await this.jobConfigModel.findOne({ where: { jobId: job.id } });
    if (config) {
      this.jobTriggerManager.registerTriggersForJob(job.topic, config);
    } else {
      this.jobConfigModel.create({
        jobId: job.id,
        cron: null,
        dependsOn: null,
        retries: null,
      } as JobConfig);
    }

    return { status: 'ok', topic };
  }

  /** Lista todos os jobs registrados */
  listJobs() {
    return Array.from(this.jobs.entries()).map(([topic, { service }]) => ({ topic, service }));
  }

  /** Permite disparo manual de um job já registrado */
  async triggerJobManually(topic: string, payload = {}) {
    if (!this.jobs.has(topic)) {
      throw new Error(`Job ${topic} não registrado`);
    }
    await this.producer.sendToJobTopic(topic, { command: 'start', payload });
    // Após disparar, notifica listeners (ex: dependentes onStart/onFinish)
    // Aqui só exemplo para finish, ajuste conforme eventos reais
    await this.jobTriggerManager.handleJobEvent('finish', topic);
  }

  async updateJobConfig(topic: string, dto: UpdateJobConfigDto) {
    this.logger.log(`Atualizando config do job ${topic}: ${JSON.stringify(dto)}`);
    
    const job = await this.jobRepository.findJobByTopic(topic);

    // Remove campos undefined para não sobrescrever valores existentes
    const update: Partial<UpdateJobConfigDto> = {};

    if (dto.cron !== undefined) update.cron = dto.cron;
    if (dto.dependsOn !== undefined) update.dependsOn = dto.dependsOn;
    if (dto.retries !== undefined) update.retries = dto.retries;

    let config = await this.jobRepository.findJobConfigByJobId(job.id);

    if (!config) {
      config = await this.jobConfigModel.create({ ...dto, jobId: job.id } as JobConfig);
    } else {
      await this.jobConfigModel.update({ ...dto }, { where: { jobId: job.id } });
    }
    
    // Atualiza os triggers para este job com a nova config
    await this.jobTriggerManager.registerTriggersForJob(job.topic, config);
    return config;
  }

  async getJobConfig(topic: string) {
    const job = await this.jobRepository.findJobByTopic(topic);
    const config = await this.jobRepository.findJobConfigByJobId(job.id);
    return config;
  }
  
  /** Inicializa todos os triggers dos jobs/configs do banco */
  async initializeAllTriggersFromDb() {
    this.logger.log('Inicializando jobs do banco de dados');
    const jobs = await this.jobRepository.findAllJobs();
    const configs = await this.jobRepository.findAllJobConfigs();
    
    // Para cada job encontrado no banco
    for (const job of jobs) {
      this.logger.log(`Restaurando job '${job.topic}' do serviço '${job.service}'`);
      
      // 1. Registrar o job na memória
      this.jobs.set(job.topic, { topic: job.topic, service: job.service });
      
      // 2. Registrar producer para o job (essencial para disparos)
      await this.producer.registerProducerForTopic(job.topic);
      
      // 3. Registrar consumer para o job
      await this.consumer.registerConsumerForJob(job.topic, async (payload) => {
        this.logger.log(`CMD recebido em ${job.topic}: ${JSON.stringify(payload)}`);
        // ex: await this.myUseCase.execute(payload);
      });
      
      // 4. Registrar lifecycle consumers
      await this.jobLifecycleConsumerService.registerLifecycleConsumersForJob(job.topic);
    }
    
    // 5. Inicializar os triggers baseados nos jobs e configs
    await this.jobTriggerManager.initializeAllTriggers(jobs, configs);
    this.logger.log(`Inicializados ${jobs.length} jobs com seus respectivos producers, consumers e triggers`);
  }
}