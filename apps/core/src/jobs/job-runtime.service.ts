import { Injectable, Logger } from '@nestjs/common';
import { WebSocketJobGatewayService } from '../transport/websocket-job-gateway.service';

@Injectable()
export class JobRuntimeService {
  private readonly logger = new Logger(JobRuntimeService.name);

  constructor(
    private readonly gateway: WebSocketJobGatewayService,
  ) {}

  async ensureTopicInfrastructure(topic: string) {
    this.logger.debug(`WebSocket transport active for topic ${topic}`);
  }

  async sendToJobTopic(topic: string, message: Record<string, unknown>) {
    await this.gateway.sendToJob(topic, message);
  }

  async sendRegistrationConfirmation(topic: string) {
    this.logger.debug(`Registration confirmation handled inline for topic ${topic}`);
  }

  async startJob(topic: string, payload: unknown = {}, metadata: Record<string, unknown> = {}) {
    await this.gateway.sendToJob(topic, payload, metadata);
  }
}
