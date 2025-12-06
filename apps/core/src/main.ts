import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilita CORS para o frontend
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  });

  // Conecta o microserviço Kafka
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'job-orchestrer-core',
        brokers: ['kafka:29092'], // ou env
      },
      consumer: {
        groupId: 'job-orchestrer-core',
        allowAutoTopicCreation: true
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