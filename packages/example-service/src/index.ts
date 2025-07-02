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

  // Inicializa o SDK com configurações do Kafka
  await JobOrchestrerSetup.init({
    kafkaBrokers: ["kafka:29092"],
    service: 'example-service',
    mainTopic: 'job-orchestrer-main', // tópico que o core está escutando
  });

  // Cria um JOB de exemplo
  JobOrchestrer.Job({
    topic: 'sample-job-topic',
    function: async () => {
      const job: SampleJob = container.get(TYPES.SampleJob);
      await job.execute();
    }
  });
})();