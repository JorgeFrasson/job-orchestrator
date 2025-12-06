import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as cron from 'node-cron';
import { Job } from '../models/job.model';
import { JobProducerService } from './jobs-producer.service';
import { JobLifecycleConsumerService } from './job-lifecycle-consumer.service';
import { JobConsumerService } from './jobs-consumer.service';

interface ScheduledJob {
  topic: string;
  task: cron.ScheduledTask;
  cronExpression: string;
}

@Injectable()
export class JobSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(JobSchedulerService.name);
  private scheduledJobs = new Map<string, ScheduledJob>();

  constructor(
    @InjectModel(Job) private jobModel: typeof Job,
    private readonly jobProducer: JobProducerService,
    private readonly jobLifecycleConsumer: JobLifecycleConsumerService,
    private readonly jobConsumer: JobConsumerService,
  ) {}

  async onModuleInit() {
    this.logger.log('🕐 Inicializando Job Scheduler...');
    await this.loadScheduledJobs();
  }

  /**
   * Carrega todos os jobs com cron configurado e agenda sua execução
   */
  async loadScheduledJobs() {
    const jobs = await this.jobModel.findAll({
      include: [{
        association: 'config',
        required: false,
      }],
      raw: false,
    });

    this.logger.log(`📋 Encontrados ${jobs.length} jobs no banco de dados`);

    let scheduledCount = 0;
    let registeredCount = 0;

    for (const job of jobs) {
      try {
        const topic = job.get('topic') as string;
        const config = job.get('config') as any;

        // Registra o consumer principal para o topic (recebe comandos)
        await this.jobConsumer.registerConsumerForJob(topic, async (payload) => {
          this.logger.log(`CMD recebido em ${topic}: ${JSON.stringify(payload)}`);
        });
        this.logger.log(`🎧 Consumer principal registrado para: ${topic}`);

        // Registra o producer para o topic (necessário para enviar mensagens)
        await this.jobProducer.registerProducerForTopic(topic);
        registeredCount++;
        this.logger.log(`✅ Producer registrado para: ${topic}`);

        // Registra consumers de lifecycle (topic-start e topic-end)
        await this.jobLifecycleConsumer.registerLifecycleConsumersForJob(topic);
        this.logger.log(`🎧 Lifecycle consumers registrados para: ${topic}`);

        // Se tem cron configurado, agenda a execução
        const cronExpression = config?.cron || config?.dataValues?.cron;
        if (cronExpression) {
          this.logger.log(`🕐 Agendando ${topic} com cron: ${cronExpression}`);
          const success = await this.scheduleJob(topic, cronExpression);
          if (success) {
            scheduledCount++;
          }
        } else {
          this.logger.log(`⏸️  Job ${topic} sem cron configurado`);
        }
      } catch (error) {
        this.logger.error(`❌ Erro ao processar job ${job.get('topic')}:`, error.message || error);
      }
    }

    this.logger.log(`✅ ${registeredCount} producers registrados`);
    this.logger.log(`✅ ${scheduledCount} jobs agendados com cron`);
  }

  /**
   * Agenda um job para execução baseado em cron expression
   */
  async scheduleJob(topic: string, cronExpression: string): Promise<boolean> {
    try {
      // Remove agendamento anterior se existir
      this.unscheduleJob(topic);

      // Valida a expressão cron
      if (!cron.validate(cronExpression)) {
        this.logger.error(`❌ Expressão cron inválida para ${topic}: ${cronExpression}`);
        return false;
      }

      // Cria a task agendada
      const task = cron.schedule(cronExpression, async () => {
        this.logger.log(`⏰ Executando job agendado: ${topic}`);
        try {
          // Garante que o producer está registrado antes de enviar
          await this.jobProducer.registerProducerForTopic(topic);
          
          await this.jobProducer.sendToJobTopic(topic, {
            command: 'start',
            timestamp: Date.now(),
            scheduled: true,
          });
          this.logger.log(`✅ Job ${topic} disparado com sucesso`);
        } catch (error) {
          this.logger.error(`❌ Erro ao disparar job ${topic}:`, error.message || error);
        }
      });

      task.start();

      // Armazena referência
      this.scheduledJobs.set(topic, {
        topic,
        task,
        cronExpression,
      });

      this.logger.log(`🕐 Job ${topic} agendado: ${cronExpression}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Erro ao agendar job ${topic}:`, error);
      return false;
    }
  }

  /**
   * Remove o agendamento de um job
   */
  unscheduleJob(topic: string): boolean {
    const scheduled = this.scheduledJobs.get(topic);
    if (scheduled) {
      scheduled.task.stop();
      this.scheduledJobs.delete(topic);
      this.logger.log(`🛑 Job ${topic} desagendado`);
      return true;
    }
    return false;
  }

  /**
   * Atualiza o agendamento de um job
   */
  async updateSchedule(topic: string, cronExpression?: string): Promise<boolean> {
    try {
      // Garante que o producer está registrado
      await this.jobProducer.registerProducerForTopic(topic);

      if (!cronExpression) {
        // Se não há cron, remove agendamento
        return this.unscheduleJob(topic);
      }

      // Agenda com nova expressão
      return await this.scheduleJob(topic, cronExpression);
    } catch (error) {
      this.logger.error(`❌ Erro ao atualizar agendamento de ${topic}:`, error.message || error);
      return false;
    }
  }

  /**
   * Lista todos os jobs agendados
   */
  getScheduledJobs(): Array<{ topic: string; cronExpression: string }> {
    return Array.from(this.scheduledJobs.values()).map(({ topic, cronExpression }) => ({
      topic,
      cronExpression,
    }));
  }

  /**
   * Verifica se um job está agendado
   */
  isScheduled(topic: string): boolean {
    return this.scheduledJobs.has(topic);
  }
}
