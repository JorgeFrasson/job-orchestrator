import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { getKafkaCoreConfig } from '../kafka/kafka.config';

@Injectable()
export class JobConsumerService implements OnModuleDestroy {
  private readonly logger = new Logger(JobConsumerService.name);
  private kafka: Kafka;
  private consumers = new Map<string, Consumer>();

  constructor() {
    const kafkaConfig = getKafkaCoreConfig();
    this.kafka = new Kafka({
      clientId: `${kafkaConfig.clientId}-job-consumer`,
      brokers: kafkaConfig.brokers,
    });
  }

  /**
   * Registra um consumer dedicado para um tópico de JOB.
   * @param topic nome do tópico do job
   * @param handler callback para processar cada mensagem
   */
  async registerConsumerForJob(
    topic: string,
    handler: (payload: any) => Promise<void>,
  ) {
    if (this.consumers.has(topic)) {
      this.logger.warn(`Consumer já registrado para tópico "${topic}"`);
      return;
    }

    const consumer = this.kafka.consumer({ groupId: `job-${topic}-group` });
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });
    await consumer.run({
      eachMessage: async ({ message }) => {
        const raw = message.value?.toString();
        if (!raw) return;
        let payload: any;
        try {
          payload = JSON.parse(raw);
        } catch (e) {
          this.logger.error(`JSON inválido em tópico ${topic}: ${raw}`);
          return;
        }
        this.logger.log(`Mensagem recebida em ${topic}: ${raw}`);
        try {
          await handler(payload);
        } catch (err) {
          this.logger.error(`Erro no handler de ${topic}: ${err.message}`);
        }
      },
    });

    this.consumers.set(topic, consumer);
    this.logger.log(`Consumer registrado para tópico de job "${topic}"`);
  }

  /** Desconecta todos os consumers ao derrubar o módulo */
  async onModuleDestroy() {
    for (const [topic, consumer] of this.consumers.entries()) {
      await consumer.disconnect();
      this.logger.log(`Consumer desconectado: ${topic}`);
    }
  }
}
