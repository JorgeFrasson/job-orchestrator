import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WebSocketJobGatewayService } from './transport/websocket-job-gateway.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const gateway = app.get(WebSocketJobGatewayService);
  const port = Number(process.env.PORT || 3000);

  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  });

  await app.listen(port);
  gateway.attach(app.getHttpServer());
  console.log('🚀 Job Orchestrator Core started');
  console.log(`📡 API available at: http://localhost:${port}`);
  console.log(`🔌 Worker gateway available at: ws://localhost:${port}/ws/jobs`);
}
bootstrap();
