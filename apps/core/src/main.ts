import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

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

  // Serve arquivos estáticos (frontend)
  app.useStaticAssets(join(__dirname, '..', '..', '..', '..', 'public'));

  // SPA route fallback (qualquer rota que não começa com /api)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(join(__dirname, '..', '..', '..', '..', 'public', 'index.html'));
  });

  // Inicia o app HTTP
  await app.listen(3000);
  console.log('Nest HTTP + Kafka Microservice started');
}
bootstrap();