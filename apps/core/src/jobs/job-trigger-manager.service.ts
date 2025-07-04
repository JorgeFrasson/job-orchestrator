import { Injectable, Logger } from '@nestjs/common';
import * as cron from 'node-cron';
import { Job } from '../models/job.model';
import { JobConfig } from '../models/job-config.model';
import { JobTriggerCallback } from './dto/job-trigger-callback.dto';

interface CronTaskHandle {
  stop: () => void;
}

interface JobTrigger {
  cronTask?: CronTaskHandle;
  onStartListeners?: Set<string>; // topics que disparam este job no start
  onFinishListeners?: Set<string>; // topics que disparam este job no finish
}

@Injectable()
export class JobTriggerManagerService {
  private readonly logger = new Logger(JobTriggerManagerService.name);
  private triggers = new Map<string, JobTrigger>(); // topic -> triggers
  private jobTriggerCallback: JobTriggerCallback | undefined;
  
  setJobTriggerCallback(cb: JobTriggerCallback) {
    this.jobTriggerCallback = cb;
  }

  /** Inicializa todos os triggers a partir dos jobs e configs do banco */
  async initializeAllTriggers(jobs: Job[], configs: JobConfig[]) {
    for (const job of jobs) {
      const config = configs.find(cfg => cfg.jobId === job.id);
      if (config) {
        this.registerTriggersForJob(job.topic, config);
      }
    }
  }

  /** Registra ou atualiza triggers para um job */
  registerTriggersForJob(jobTopic: string, config: JobConfig) {
    this.logger.log(`Registrando triggers para job '${jobTopic}'`);
    this.removeTriggersForJob(jobTopic);
    const trigger: JobTrigger = {};

    // CRON
    if (config.cron) {
      const cronTask = cron.schedule(config.cron, async () => {
        this.logger.log(`Disparando job '${jobTopic}' via CRON: ${config.cron}`);
        if (this.jobTriggerCallback) {
          await this.jobTriggerCallback(jobTopic, 'cron');
        }
      }, { timezone: 'America/Sao_Paulo' });
      cronTask.start();
      trigger.cronTask = cronTask;
    }

    // OnStart/OnFinish listeners: apenas registra referência, lógica será feita via eventos
    if (config.dependsOn && Array.isArray(config.dependsOn)) {
      // Exemplo: depende do finish de outros jobs
      trigger.onFinishListeners = new Set(config.dependsOn);
    }

    this.triggers.set(jobTopic, trigger);
    this.logger.log(`Triggers registrados para job '${jobTopic}'`);
  }

  /** Remove todos os triggers de um job (antes de atualizar ou deletar config) */
  removeTriggersForJob(topic: string) {
    const trigger = this.triggers.get(topic);
    if (trigger?.cronTask) {
      trigger.cronTask.stop();
    }
    this.triggers.delete(topic);
  }

  /** Dispara jobs dependentes ao receber evento de outro job */
  async handleJobEvent(event: 'start' | 'finish', topic: string) {
    for (const [jobTopic, trigger] of this.triggers.entries()) {
      if (event === 'finish' && trigger.onFinishListeners?.has(topic)) {
        this.logger.log(`Disparando job '${jobTopic}' por dependência (finish de '${topic}')`);
        if (this.jobTriggerCallback) {
          await this.jobTriggerCallback(jobTopic, 'dependsOn');
        }
      }
      // Futuramente: adicionar lógica para onStartListeners
    }
  }
}
