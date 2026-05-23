import { Admin, Kafka } from 'kafkajs';
import { OrchestratorConfig } from '../config/orchestrator.config';

export class OrchestratorTopicProvisioner {
  private static admin: Admin | undefined;
  private static connected = false;

  static async ensureMainTopic() {
    const { mainTopic, topicPartitions, topicReplicationFactor } = OrchestratorConfig.getOptions();
    await this.ensureTopics([
      {
        name: mainTopic,
        numPartitions: topicPartitions,
        replicationFactor: topicReplicationFactor,
      },
    ]);
  }

  static async ensureJobTopics(topic: string) {
    const { topicPartitions, topicReplicationFactor } = OrchestratorConfig.getOptions();

    await this.ensureTopics(
      [topic, `${topic}-start`, `${topic}-end`, `${topic}-fail`].map((name) => ({
        name,
        numPartitions: topicPartitions,
        replicationFactor: topicReplicationFactor,
      })),
    );
  }

  private static async ensureTopics(
    topics: Array<{ name: string; numPartitions: number; replicationFactor: number }>,
  ) {
    const { topicManagementMode } = OrchestratorConfig.getOptions();
    const admin = await this.getAdmin();
    const existingTopics = new Set(await admin.listTopics());
    const missingTopics = topics.filter(({ name }) => !existingTopics.has(name));

    if (missingTopics.length === 0) {
      return;
    }

    if (topicManagementMode === 'validate') {
      throw new Error(
        `Missing Kafka topics: ${missingTopics.map(({ name }) => name).join(', ')}. ` +
          'Provision them before starting the SDK or switch topicManagementMode to create_if_missing.',
      );
    }

    await admin.createTopics({
      waitForLeaders: true,
      topics: missingTopics.map(({ name, numPartitions, replicationFactor }) => ({
        topic: name,
        numPartitions,
        replicationFactor,
      })),
    });
  }

  private static async getAdmin() {
    if (!this.admin) {
      const { kafkaBrokers, service } = OrchestratorConfig.getOptions();
      const kafka = new Kafka({
        clientId: `${service}-sdk-admin`,
        brokers: kafkaBrokers,
      });
      this.admin = kafka.admin();
    }

    if (!this.connected) {
      await this.admin.connect();
      this.connected = true;
    }

    return this.admin;
  }

  static async disconnect() {
    if (this.admin && this.connected) {
      await this.admin.disconnect();
    }

    this.admin = undefined;
    this.connected = false;
  }

  static resetForTests() {
    this.admin = undefined;
    this.connected = false;
  }
}
