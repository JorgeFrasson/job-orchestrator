import 'reflect-metadata';
import { bindings } from './config/Container';
import TYPES from './config/Types';
import { JobOrchestrer, JobOrchestrerSetup } from '@jorge_henriquef/job-orchestrator-node';
import { Container } from 'inversify';
import { SampleJob } from './jobs/SampleJob';
import { SecondJob } from './jobs/SecondJob';

declare const process:
  | {
      env: Record<string, string | undefined>;
    }
  | undefined;

// Inicializa o container inversify
(async () => {
  const container = new Container();
  await container.loadAsync(bindings);

  console.log('🔧 Iniciando Example Service...');

  // Inicializa o SDK com configurações do core
  await JobOrchestrerSetup.init({
    coreUrl: process?.env.CORE_URL || 'ws://localhost:3000',
    service: 'example-service',
  });

  console.log('✅ Conexão com core estabelecida');
  console.log('📝 Registrando job: sample-job-topic');

  // Cria um JOB de exemplo que roda de 10 em 10 segundos
  await JobOrchestrer.Job({
    topic: 'sample-job-topic',
    function: async (payload) => {
      const job: SampleJob = container.get(TYPES.SampleJob);
      await job.execute(payload);
    },
    onStart: async (payload) => {
      console.log('🟢 Job iniciando...', payload ? `com payload: ${JSON.stringify(payload)}` : '');
    },
    onFinish: async (payload) => {
      console.log('🏁 Job finalizado!');
    }
  });


  await JobOrchestrer.Job({
    topic: 'job-2-topic',
    function: async (payload) => {
      const job: SecondJob = container.get(TYPES.SecondJob);
      await job.execute(payload);
    },
    onStart: async (payload) => {
      console.log('🟢 Job 2 iniciando...', payload ? `com payload: ${JSON.stringify(payload)}` : '');
    },
    onFinish: async (payload) => {
      console.log('🏁 Job 2 finalizado!');
    }
  });

  await JobOrchestrer.Job({
    topic: 'job-3-inline-topic',
    function: async (payload) => {
      console.log('Executando job 3 inline...', payload);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simula trabalho
    },
    onStart: async (payload) => {
      console.log('🟢 Job 3 iniciando...', payload ? `com payload: ${JSON.stringify(payload)}` : '');
    },
    onFinish: async (payload) => {
      console.log('🏁 Job 3 finalizado!');
    }
  });

  console.log('✅ Jobs registrados com sucesso!');
  console.log('   - sample-job-topic');
  console.log('   - job-2-topic');
  console.log('⏰ Configure o cron no frontend ou via API:');
  console.log('   PATCH http://localhost:3000/jobs/sample-job-topic/config');
  console.log('   Body: { "cron": "*/10 * * * * *" }');
  console.log('');
  console.log('💡 Ou dispare manualmente:');
  console.log('   POST http://localhost:3000/jobs/sample-job-topic/start');
  console.log('   Body: { "payload": { "test": true } }');
  console.log('');
  console.log('🎯 Aguardando execuções...');
})();
