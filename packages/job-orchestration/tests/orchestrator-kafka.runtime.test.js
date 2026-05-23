const test = require('node:test');
const assert = require('node:assert/strict');

const { OrchestratorConfig } = require('../dist/config/orchestrator.config.js');
const { OrchestratorKafkaRuntime } = require('../dist/kafka/orchestrator-kafka.runtime.js');

function createRuntimeHarness() {
  const sentMessages = [];
  const subscriptions = [];
  const runHandlers = [];
  let producerConnections = 0;
  let consumerConnections = 0;
  let consumerFactoryCalls = 0;

  const producer = {
    async connect() {
      producerConnections += 1;
    },
    async send(message) {
      sentMessages.push(message);
    },
  };

  const consumer = {
    async connect() {
      consumerConnections += 1;
    },
    async subscribe(subscription) {
      subscriptions.push(subscription);
    },
    async run({ eachMessage }) {
      runHandlers.push(eachMessage);
    },
  };

  return {
    sentMessages,
    subscriptions,
    runHandlers,
    getProducerConnections: () => producerConnections,
    getConsumerConnections: () => consumerConnections,
    getConsumerFactoryCalls: () => consumerFactoryCalls,
    kafkaClient: {
      producer() {
        return producer;
      },
      consumer() {
        consumerFactoryCalls += 1;
        return consumer;
      },
    },
  };
}

test.beforeEach(() => {
  OrchestratorConfig.init({
    kafkaBrokers: ['localhost:9092'],
    service: 'example-service',
    mainTopic: 'custom-main-topic',
  });
});

test.afterEach(() => {
  OrchestratorKafkaRuntime.resetForTests();
  OrchestratorConfig.resetForTests();
});

test('publishRegistration sends the message to the configured main topic', async () => {
  const harness = createRuntimeHarness();
  const originalCreateKafkaClient = OrchestratorKafkaRuntime.createKafkaClient;

  OrchestratorKafkaRuntime.createKafkaClient = () => harness.kafkaClient;

  try {
    await OrchestratorKafkaRuntime.publishRegistration({
      topic: 'invoice.generate',
      service: 'example-service',
    });

    assert.equal(harness.getProducerConnections(), 1);
    assert.deepEqual(harness.sentMessages, [
      {
        topic: 'custom-main-topic',
        messages: [
          {
            key: 'invoice.generate',
            value: JSON.stringify({
              topic: 'invoice.generate',
              service: 'example-service',
            }),
          },
        ],
      },
    ]);
  } finally {
    OrchestratorKafkaRuntime.createKafkaClient = originalCreateKafkaClient;
  }
});

test('publishLifecycleEvent sends start and end events with the topic suffix', async () => {
  const harness = createRuntimeHarness();
  const originalCreateKafkaClient = OrchestratorKafkaRuntime.createKafkaClient;

  OrchestratorKafkaRuntime.createKafkaClient = () => harness.kafkaClient;

  try {
    await OrchestratorKafkaRuntime.publishLifecycleEvent('invoice.generate', 'start', { id: 1 });
    await OrchestratorKafkaRuntime.publishLifecycleEvent('invoice.generate', 'end', { id: 1 });

    assert.equal(harness.sentMessages.length, 2);
    assert.equal(harness.sentMessages[0].topic, 'invoice.generate-start');
    assert.equal(harness.sentMessages[1].topic, 'invoice.generate-end');

    const startPayload = JSON.parse(harness.sentMessages[0].messages[0].value);
    const endPayload = JSON.parse(harness.sentMessages[1].messages[0].value);

    assert.equal(startPayload.event, 'start');
    assert.equal(endPayload.event, 'end');
    assert.deepEqual(startPayload.payload, { id: 1 });
    assert.deepEqual(endPayload.payload, { id: 1 });
  } finally {
    OrchestratorKafkaRuntime.createKafkaClient = originalCreateKafkaClient;
  }
});

test('subscribeToJobTopic creates one consumer per topic and parses JSON messages', async () => {
  const harness = createRuntimeHarness();
  const originalCreateKafkaClient = OrchestratorKafkaRuntime.createKafkaClient;
  const receivedPayloads = [];

  OrchestratorKafkaRuntime.createKafkaClient = () => harness.kafkaClient;

  try {
    await OrchestratorKafkaRuntime.subscribeToJobTopic('invoice.generate', async (payload) => {
      receivedPayloads.push(payload);
    });

    await OrchestratorKafkaRuntime.subscribeToJobTopic('invoice.generate', async () => {
      throw new Error('should not subscribe twice for the same topic');
    });

    assert.equal(harness.getConsumerFactoryCalls(), 1);
    assert.equal(harness.getConsumerConnections(), 1);
    assert.deepEqual(harness.subscriptions, [
      { topic: 'invoice.generate', fromBeginning: false },
    ]);

    await harness.runHandlers[0]({
      message: {
        value: Buffer.from(JSON.stringify({ command: 'start', payload: { id: 10 } })),
      },
    });

    await harness.runHandlers[0]({
      message: {
        value: Buffer.from('plain-text-command'),
      },
    });

    assert.deepEqual(receivedPayloads, [
      { command: 'start', payload: { id: 10 } },
      'plain-text-command',
    ]);
  } finally {
    OrchestratorKafkaRuntime.createKafkaClient = originalCreateKafkaClient;
  }
});

test('publish operations share the same producer connection when called concurrently', async () => {
  const sentMessages = [];
  let producerConnections = 0;

  const producer = {
    async connect() {
      producerConnections += 1;
      await new Promise((resolve) => setTimeout(resolve, 10));
    },
    async send(message) {
      sentMessages.push(message);
    },
  };

  const originalCreateKafkaClient = OrchestratorKafkaRuntime.createKafkaClient;
  OrchestratorKafkaRuntime.createKafkaClient = () => ({
    producer() {
      return producer;
    },
  });

  try {
    await Promise.all([
      OrchestratorKafkaRuntime.publishRegistration({
        topic: 'invoice.generate',
        service: 'example-service',
      }),
      OrchestratorKafkaRuntime.publishLifecycleEvent('invoice.generate', 'start', {
        executionId: 'exec-1',
      }),
    ]);

    assert.equal(producerConnections, 1);
    assert.equal(sentMessages.length, 2);
  } finally {
    OrchestratorKafkaRuntime.createKafkaClient = originalCreateKafkaClient;
  }
});
