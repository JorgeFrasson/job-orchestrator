import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { getKafkaCoreConfig } from './kafka/kafka.config';
import { TopicProvisioningService } from './kafka/topic-provisioning.service';

async function bootstrap() {
  const kafkaConfig = getKafkaCoreConfig();
  const app = await NestFactory.create(AppModule);
  const topicProvisioning = app.get(TopicProvisioningService);

  // Habilita CORS para o frontend
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  });

  await topicProvisioning.ensureMainTopic();

  // Conecta o microserviço Kafka
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: kafkaConfig.clientId,
        brokers: kafkaConfig.brokers,
      },
      consumer: {
        groupId: 'job-orchestrer-core',
        allowAutoTopicCreation: false
      },
    },
  });

  // Inicia o microserviço Kafka (consumo de mensagens)
  await app.startAllMicroservices();

  // Inicia o app HTTP (apenas API)
  await app.listen(3000);
  console.log('🚀 Job Orchestrator Core started');
  console.log('📡 API available at: http://localhost:3000');
  console.log('📨 Kafka consumer running');
}
bootstrap();
