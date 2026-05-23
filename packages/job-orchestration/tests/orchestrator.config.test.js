const test = require('node:test');
const assert = require('node:assert/strict');

const { OrchestratorConfig } = require('../dist/config/orchestrator.config.js');
const { OrchestratorKafkaRuntime } = require('../dist/kafka/orchestrator-kafka.runtime.js');

test.afterEach(() => {
  OrchestratorConfig.resetForTests();
  OrchestratorKafkaRuntime.resetForTests();
});

test('OrchestratorConfig throws when accessed before initialization', () => {
  assert.throws(
    () => OrchestratorConfig.getOptions(),
    /has not been initialized yet/,
  );
});

test('OrchestratorConfig fills the default main topic', () => {
  OrchestratorConfig.init({
    kafkaBrokers: ['localhost:9092'],
    service: 'billing-service',
  });

  assert.deepEqual(OrchestratorConfig.getOptions(), {
    kafkaBrokers: ['localhost:9092'],
    service: 'billing-service',
    mainTopic: 'job-orchestrer-main',
    topicManagementMode: 'validate',
    topicPartitions: 1,
    topicReplicationFactor: 1,
  });
});
