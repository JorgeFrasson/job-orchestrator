// src/jobs/jobs.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RegisterJobDto } from './dto/register-job.dto';
import { JobProducerService } from './jobs-producer.service';
import { JobConsumerService } from './jobs-consumer.service';
import { JobLifecycleConsumerService } from './job-lifecycle-consumer.service';
import { JobSchedulerService } from './job-scheduler.service';
import { Job } from '../models/job.model';

// interface JobEntry removida: configuração agora é apenas no core via HTTP

@Injectable()
export class JobsService implements OnModuleInit {
  constructor(
    private readonly producer: JobProducerService,
    private readonly consumer: JobConsumerService,
    private readonly jobLifecycleConsumerService: JobLifecycleConsumerService,
    private readonly jobScheduler: JobSchedulerService,
    @InjectModel(Job) private jobModel: typeof Job,
  ) {}

  private readonly logger = new Logger(JobsService.name);
  private jobs = new Map<string, { topic: string; service: string }>();
  private initialized = false;

  async onModuleInit() {
    // Aguarda um pouco para garantir que o scheduler inicializou primeiro
    setTimeout(() => this.loadExistingJobs(), 1000);
  }

  /**
   * Carrega jobs existentes do banco ao iniciar o core
   * Não cria novos registros, apenas registra producers/consumers
   */
  private async loadExistingJobs() {
    try {
      this.logger.log('📂 Carregando jobs existentes do banco de dados...');
      
      const existingJobs = await this.jobModel.findAll({
        include: [{
          association: 'config',
          required: false,
        }],
        raw: false,
      });

      this.logger.log(`📋 Encontrados ${existingJobs.length} jobs cadastrados`);

      for (const job of existingJobs) {
        // Acessa os valores através de get() ou diretamente das propriedades
        const topic = job.get('topic') as string;
        const service = job.get('service') as string;
        
        // Adiciona à memória sem registrar novamente no Kafka
        this.jobs.set(topic, { topic, service });
        
        this.logger.log(`✓ Job ${topic} carregado (${service})`);
      }

      this.initialized = true;
      this.logger.log(`✅ ${existingJobs.length} jobs carregados em memória`);
    } catch (error) {
      this.logger.error('❌ Erro ao carregar jobs existentes:', error.message || error);
    }
  }

  /** Chamado quando o SDK publica no tópico principal */
  async handleJobRegistration(dto: RegisterJobDto) {
    const topic = dto.topic;
    const service = dto.service;

    // Verifica se o job já está registrado em memória (evita reprocessamento)
    if (this.jobs.has(topic)) {
      this.logger.log(`✅ Job ${topic} já registrado, ignorando duplicata`);
      return { status: 'already_registered', topic };
    }

    this.logger.log(`📝 Registrando novo job: ${topic} (serviço: ${service})`);

    // 1) Persiste o Job no banco primeiro (ou atualiza se existir)
    let job = await this.jobModel.findOne({ where: { topic } });
    const isNewJob = !job;
    
    if (!job) {
      job = await this.jobModel.create({
        topic: topic,
        service: service
      } as any);
      this.logger.log(`➕ Job ${topic} criado no banco de dados`);
    } else {
      await job.update({ service });
      this.logger.log(`🔄 Job ${topic} atualizado no banco de dados`);
    }

    // 2) Registra Producer e Consumer
    await this.producer.registerProducerForTopic(topic);
    await this.consumer.registerConsumerForJob(topic, async (payload) => {
      this.logger.log(`CMD recebido em ${topic}: ${JSON.stringify(payload)}`);
    });

    // Registra os consumers de lifecycle para <topic>-start e <topic>-end
    await this.jobLifecycleConsumerService.registerLifecycleConsumersForJob(topic);

    // 3) Armazena estado em memória
    this.jobs.set(topic, { topic, service });

    // 4) Se já existia no banco e tinha cron, agenda automaticamente
    if (!isNewJob && job.config?.cron) {
      await this.jobScheduler.updateSchedule(topic, job.config.cron);
      this.logger.log(`🕐 Job ${topic} reagendado com cron: ${job.config.cron}`);
    }

    // 5) Confirma registro para o job
    await this.producer.sendToJobTopic(topic, {
      event: 'JOB_REGISTERED',
      timestamp: Date.now(),
    });

    this.logger.log(`✅ Job ${topic} registrado com sucesso`);
    return { status: 'ok', topic, isNew: isNewJob };
  }

  /** Lista todos os jobs registrados */
  listJobs() {
    return Array.from(this.jobs.entries()).map(([topic, { service }]) => ({ topic, service }));
  }

  /** Lista todos os jobs do banco de dados */
  async getAllJobs() {
    return this.jobModel.findAll({
      include: ['config'],
      order: [['createdAt', 'DESC']]
    });
  }

  /** Busca um job específico */
  async getJob(topic: string) {
    const job = await this.jobModel.findOne({
      where: { topic },
      include: ['config']
    });
    
    if (!job) {
      throw new Error(`Job ${topic} não encontrado`);
    }
    
    return job;
  }

  /** Atualiza a configuração de um job */
  async updateJobConfig(topic: string, configData: any) {
    const job = await this.jobModel.findOne({
      where: { topic },
      include: ['config']
    });

    if (!job) {
      throw new Error(`Job ${topic} não encontrado`);
    }

    // Importa o modelo JobConfig
    const { JobConfig } = await import('../models/job-config.model');

    if (job.config) {
      // Atualiza config existente
      await job.config.update(configData);
    } else {
      // Cria nova config
      await JobConfig.create({
        ...configData,
        jobId: job.id
      });
    }

    // Atualiza o agendamento se houver cron
    if (configData.cron !== undefined) {
      await this.jobScheduler.updateSchedule(topic, configData.cron);
      this.logger.log(`🕐 Agendamento atualizado para ${topic}: ${configData.cron || 'removido'}`);
    }

    // Retorna o job atualizado
    return this.jobModel.findOne({
      where: { topic },
      include: ['config']
    });
  }

  /** Permite disparo manual de um job já registrado */
  async triggerJobManually(topic: string, payload = {}) {
    if (!this.jobs.has(topic)) {
      throw new Error(`Job ${topic} não registrado`);
    }
    await this.producer.sendToJobTopic(topic, { command: 'start', payload });
  }
}