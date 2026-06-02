import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { Job } from '../models/job.model';
import { JobConfig } from '../models/job-config.model';
import { JobExecution } from '../models/job-execution.model';

export function getDatabaseConfig(): SequelizeModuleOptions {
  const storage = resolve('./data/job-orchestrator.sqlite');
  mkdirSync(dirname(storage), { recursive: true });

  return {
    dialect: 'sqlite',
    storage,
    models: [Job, JobConfig, JobExecution],
    autoLoadModels: true,
    synchronize: true,
    logging: false,
  };
}
