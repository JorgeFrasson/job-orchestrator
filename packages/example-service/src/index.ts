import 'reflect-metadata';
import { bindings } from './config/Container';
import TYPES from './config/Types';
import { JobOrchestrer, JobOrchestrerSetup } from '@job-orchestration/sdk';
import { Container } from 'inversify';
import { SampleJob } from './jobs/SampleJob';

// Inicializa o container inversify
(async () => {
  const container = new Container();
  await container.loadAsync(bindings);

  console.log('🔧 Iniciando Example Service...');

  // Inicializa o SDK com configurações do Kafka
  await JobOrchestrerSetup.init({
    kafkaBrokers: ["kafka:29092"],
    service: 'example-service',
    mainTopic: 'job-orchestrer-main', // tópico que o core está escutando
  });

  console.log('✅ Conexão com Kafka estabelecida');
  console.log('📝 Registrando job: sample-job-topic');

  // Cria um JOB de exemplo que roda de 10 em 10 segundos
  JobOrchestrer.Job({
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

  console.log('✅ Job registrado com sucesso!');
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