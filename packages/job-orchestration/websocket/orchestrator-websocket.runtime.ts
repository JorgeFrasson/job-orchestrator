import WebSocket from 'ws';
import { OrchestratorConfig } from '../config/orchestrator.config';
import { JobCommandHandler, JobEventName, JobRegistrationMessage } from '../types/jobs.types';

type CoreMessage =
  | {
      type: 'execute_job';
      topic: string;
      executionId: string;
      payload: unknown;
      metadata?: Record<string, unknown>;
    }
  | { type: 'registration_ack'; topic: string; status: 'ok' | 'already_registered' };

export class OrchestratorWebSocketRuntime {
  private static socket: WebSocket | undefined;
  private static connectionPromise: Promise<WebSocket> | undefined;
  private static reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  private static handlersByTopic = new Map<string, JobCommandHandler>();
  private static registrationsByTopic = new Map<string, JobRegistrationMessage>();

  static async publishRegistration(message: JobRegistrationMessage, handler: JobCommandHandler) {
    this.handlersByTopic.set(message.topic, handler);
    this.registrationsByTopic.set(message.topic, message);

    await this.send({
      type: 'register_job',
      topic: message.topic,
      service: message.service,
    });
  }

  static async publishLifecycleEvent(topic: string, event: JobEventName, payload: unknown) {
    const executionId =
      payload && typeof payload === 'object' && 'executionId' in payload
        ? (payload as { executionId?: string }).executionId
        : undefined;

    const errorMessage =
      payload && typeof payload === 'object' && 'errorMessage' in payload
        ? String((payload as { errorMessage?: string }).errorMessage)
        : undefined;

    await this.send({
      type: 'lifecycle_event',
      topic,
      event,
      executionId,
      payload,
      errorMessage,
      timestamp: Date.now(),
    });
  }

  private static async send(message: Record<string, unknown>) {
    const socket = await this.getSocket();
    socket.send(JSON.stringify(message));
  }

  private static async getSocket() {
    if (!this.connectionPromise) {
      this.connectionPromise = this.connect();
    }

    this.socket = await this.connectionPromise;
    return this.socket;
  }

  private static connect() {
    const { coreUrl } = OrchestratorConfig.getOptions();
    const endpoint = `${stripTrailingSlash(coreUrl!)}/ws/jobs`;

    return new Promise<WebSocket>((resolve, reject) => {
      const socket = new WebSocket(endpoint);
      let settled = false;

      socket.once('open', () => {
        settled = true;
        this.socket = socket;
        this.connectionPromise = Promise.resolve(socket);
        this.replayRegistrations();
        resolve(socket);
      });

      socket.on('message', (raw) => {
        void this.handleMessage(raw.toString());
      });

      socket.once('error', (error) => {
        if (!settled) {
          this.connectionPromise = undefined;
          reject(error);
          return;
        }
      });

      socket.on('close', () => {
        this.socket = undefined;
        this.connectionPromise = undefined;
        this.scheduleReconnect();
      });
    });
  }

  private static async handleMessage(raw: string) {
    let message: CoreMessage;

    try {
      message = JSON.parse(raw) as CoreMessage;
    } catch {
      return;
    }

    if (message.type !== 'execute_job') {
      return;
    }

    const handler = this.handlersByTopic.get(message.topic);

    if (!handler) {
      return;
    }

    await handler({
      executionId: message.executionId,
      payload: message.payload,
      metadata: message.metadata,
    });
  }

  private static replayRegistrations() {
    for (const registration of this.registrationsByTopic.values()) {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        return;
      }

      this.socket.send(
        JSON.stringify({
          type: 'register_job',
          topic: registration.topic,
          service: registration.service,
        }),
      );
    }
  }

  private static scheduleReconnect() {
    if (this.reconnectTimer) {
      return;
    }

    const { reconnectIntervalMs } = OrchestratorConfig.getOptions();
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      void this.getSocket().catch(() => {
        this.scheduleReconnect();
      });
    }, reconnectIntervalMs);
  }

  static async resetForTests() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.close();
    }

    this.socket = undefined;
    this.connectionPromise = undefined;
    this.handlersByTopic = new Map<string, JobCommandHandler>();
    this.registrationsByTopic = new Map<string, JobRegistrationMessage>();
  }
}

function stripTrailingSlash(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}
