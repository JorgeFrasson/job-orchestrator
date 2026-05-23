const test = require('node:test');
const assert = require('node:assert/strict');

const { TopicProvisioningService } = require('../build/src/kafka/topic-provisioning.service.js');
const { createAsyncSpy } = require('./helpers.js');

function createServiceWithEnv({
  mode = 'validate',
  mainTopic = 'job-orchestrer-main',
  partitions = '1',
  replicationFactor = '1',
} = {}) {
  const previousEnv = {
    KAFKA_BROKERS: process.env.KAFKA_BROKERS,
    KAFKA_MAIN_TOPIC: process.env.KAFKA_MAIN_TOPIC,
    KAFKA_TOPIC_MANAGEMENT_MODE: process.env.KAFKA_TOPIC_MANAGEMENT_MODE,
    KAFKA_TOPIC_PARTITIONS: process.env.KAFKA_TOPIC_PARTITIONS,
    KAFKA_TOPIC_REPLICATION_FACTOR: process.env.KAFKA_TOPIC_REPLICATION_FACTOR,
  };

  process.env.KAFKA_BROKERS = 'localhost:9092';
  process.env.KAFKA_MAIN_TOPIC = mainTopic;
  process.env.KAFKA_TOPIC_MANAGEMENT_MODE = mode;
  process.env.KAFKA_TOPIC_PARTITIONS = partitions;
  process.env.KAFKA_TOPIC_REPLICATION_FACTOR = replicationFactor;

  const service = new TopicProvisioningService();

  return {
    service,
    restoreEnv() {
      Object.entries(previousEnv).forEach(([key, value]) => {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      });
    },
  };
}

test('TopicProvisioningService fails in validate mode when topics are missing', async () => {
  const { service, restoreEnv } = createServiceWithEnv({ mode: 'validate' });
  const admin = {
    connect: createAsyncSpy(),
    disconnect: createAsyncSpy(),
    listTopics: createAsyncSpy(async () => []),
    createTopics: createAsyncSpy(),
  };

  service.admin = admin;

  try {
    await assert.rejects(
      () => service.ensureMainTopic(),
      /Missing Kafka topics: job-orchestrer-main/,
    );

    assert.equal(admin.connect.calledTimes(), 1);
    assert.equal(admin.createTopics.calledTimes(), 0);
  } finally {
    restoreEnv();
  }
});

test('TopicProvisioningService creates missing topics in create_if_missing mode', async () => {
  const { service, restoreEnv } = createServiceWithEnv({
    mode: 'create_if_missing',
    partitions: '3',
    replicationFactor: '2',
  });
  const admin = {
    connect: createAsyncSpy(),
    disconnect: createAsyncSpy(),
    listTopics: createAsyncSpy(async () => ['job-orchestrer-main']),
    createTopics: createAsyncSpy(async () => true),
  };

  service.admin = admin;

  try {
    await service.ensureJobTopics('invoice.generate');

    assert.equal(admin.connect.calledTimes(), 1);
    assert.equal(admin.createTopics.calledTimes(), 1);
    assert.deepEqual(admin.createTopics.lastCall()[0], {
      waitForLeaders: true,
      topics: [
        { topic: 'invoice.generate', numPartitions: 3, replicationFactor: 2 },
        { topic: 'invoice.generate-start', numPartitions: 3, replicationFactor: 2 },
        { topic: 'invoice.generate-end', numPartitions: 3, replicationFactor: 2 },
        { topic: 'invoice.generate-fail', numPartitions: 3, replicationFactor: 2 },
      ],
    });
  } finally {
    restoreEnv();
  }
});

test('TopicProvisioningService deduplicates root topics when ensuring many job topics', async () => {
  const { service, restoreEnv } = createServiceWithEnv({ mode: 'create_if_missing' });
  const admin = {
    connect: createAsyncSpy(),
    disconnect: createAsyncSpy(),
    listTopics: createAsyncSpy(async () => []),
    createTopics: createAsyncSpy(async () => true),
  };

  service.admin = admin;

  try {
    await service.ensureJobTopicsForMany(['job-a', 'job-a', 'job-b']);
    assert.equal(admin.createTopics.calledTimes(), 2);
  } finally {
    restoreEnv();
  }
});

test('TopicProvisioningService disconnects the admin client on destroy', async () => {
  const { service, restoreEnv } = createServiceWithEnv();
  const admin = {
    connect: createAsyncSpy(),
    disconnect: createAsyncSpy(),
    listTopics: createAsyncSpy(async () => ['job-orchestrer-main']),
    createTopics: createAsyncSpy(),
  };

  service.admin = admin;

  try {
    await service.ensureMainTopic();
    await service.onModuleDestroy();
    assert.equal(admin.disconnect.calledTimes(), 1);
  } finally {
    restoreEnv();
  }
});
