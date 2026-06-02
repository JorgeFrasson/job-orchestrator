import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { IncomingMessage } from 'node:http';
import { randomUUID } from 'node:crypto';
import { Server } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { RegisterJobUseCase } from '../jobs/use-cases/register-job.use-case';
import { JobExecutionHistoryService } from '../jobs/job-execution-history.service';
import { JobIntegrationsService } from '../jobs/job-integrations.service';

type WorkerMessage =
  | { type: 'register_job'; topic: string; service: string }
  | {
      type: 'lifecycle_event';
      topic: string;
      event: 'start' | 'end' | 'fail';
      executionId?: string;
      payload?: unknown;
      timestamp?: number;
      errorMessage?: string;
    };

type CoreMessage =
  | {
      type: 'execute_job';
      topic: string;
      executionId: string;
      payload: unknown;
      metadata?: Record<string, unknown>;
    }
  | { type: 'registration_ack'; topic: string; status: 'ok' | 'already_registered' };

interface WorkerConnection {
  id: string;
  socket: WebSocket;
  service?: string;
  topics: Set<string>;
}

@Injectable()
export class WebSocketJobGatewayService {
  private readonly logger = new Logger(WebSocketJobGatewayService.name);
  private server?: WebSocketServer;
  private readonly connections = new Map<WebSocket, WorkerConnection>();
  private readonly topicRoutes = new Map<string, WorkerConnection[]>();
  private readonly topicCursor = new Map<string, number>();

  constructor(
    @Inject(forwardRef(() => RegisterJobUseCase))
    private readonly registerJobUseCase: RegisterJobUseCase,
    private readonly historyService: JobExecutionHistoryService,
    private readonly integrationsService: JobIntegrationsService,
  ) {}

  attach(httpServer: Server) {
    if (this.server) {
      return;
    }

    this.server = new WebSocketServer({
      server: httpServer,
      path: '/ws/jobs',
    });

    this.server.on('connection', (socket, request) => {
      this.handleConnection(socket, request);
    });

    this.logger.log('WebSocket job gateway attached at /ws/jobs');
  }

  async sendToJob(topic: string, payload: unknown, metadata: Record<string, unknown> = {}) {
    const connection = this.pickConnection(topic);

    if (!connection) {
      throw new Error(`No connected worker found for topic ${topic}`);
    }

    this.send(connection.socket, {
      type: 'execute_job',
      topic,
      executionId: randomUUID(),
      payload,
      metadata,
    });
  }

  private handleConnection(socket: WebSocket, request: IncomingMessage) {
    const connection: WorkerConnection = {
      id: randomUUID(),
      socket,
      topics: new Set<string>(),
    };

    this.connections.set(socket, connection);
    this.logger.log(`Worker connected: ${connection.id} from ${request.socket.remoteAddress}`);

    socket.on('message', (raw) => {
      void this.handleMessage(connection, raw.toString());
    });

    socket.on('close', () => {
      this.unregisterConnection(connection);
      this.logger.log(`Worker disconnected: ${connection.id}`);
    });

    socket.on('error', (error) => {
      this.logger.error(`Worker socket error on ${connection.id}: ${error.message}`);
    });
  }

  private async handleMessage(connection: WorkerConnection, raw: string) {
    let message: WorkerMessage;

    try {
      message = JSON.parse(raw) as WorkerMessage;
    } catch (error) {
      this.logger.warn(`Ignoring invalid worker payload: ${raw}`);
      return;
    }

    if (message.type === 'register_job') {
      connection.service = message.service;
      await this.registerTopic(connection, message.topic, message.service);
      return;
    }

    if (message.type === 'lifecycle_event') {
      const payload = {
        event: message.event,
        executionId: message.executionId,
        payload: message.payload,
        timestamp: message.timestamp || Date.now(),
        errorMessage: message.errorMessage,
      };

      await this.historyService.recordLifecycleEvent(message.topic, message.event, payload);

      if (message.event === 'start') {
        await this.integrationsService.executeLifecycleEvent(message.topic, 'onStart', payload);
      }

      if (message.event === 'end') {
        await this.integrationsService.executeLifecycleEvent(message.topic, 'onFinish', payload);
      }
    }
  }

  private async registerTopic(connection: WorkerConnection, topic: string, service: string) {
    const result = await this.registerJobUseCase.execute({
      topic,
      service,
      config: {},
    });

    connection.topics.add(topic);

    const routes = this.topicRoutes.get(topic) || [];
    if (!routes.some(({ id }) => id === connection.id)) {
      routes.push(connection);
      this.topicRoutes.set(topic, routes);
    }

    this.send(connection.socket, {
      type: 'registration_ack',
      topic,
      status: result.status === 'already_registered' ? 'already_registered' : 'ok',
    });
  }

  private pickConnection(topic: string) {
    const routes = (this.topicRoutes.get(topic) || []).filter(
      ({ socket }) => socket.readyState === WebSocket.OPEN,
    );

    if (!routes.length) {
      return undefined;
    }

    const cursor = this.topicCursor.get(topic) || 0;
    const connection = routes[cursor % routes.length];

    this.topicCursor.set(topic, (cursor + 1) % routes.length);
    this.topicRoutes.set(topic, routes);

    return connection;
  }

  private unregisterConnection(connection: WorkerConnection) {
    this.connections.delete(connection.socket);

    for (const topic of connection.topics) {
      const routes = (this.topicRoutes.get(topic) || []).filter(({ id }) => id !== connection.id);

      if (routes.length) {
        this.topicRoutes.set(topic, routes);
      } else {
        this.topicRoutes.delete(topic);
        this.topicCursor.delete(topic);
      }
    }
  }

  private send(socket: WebSocket, message: CoreMessage) {
    socket.send(JSON.stringify(message));
  }
}
