const test = require('node:test');
const assert = require('node:assert/strict');

const { JobOrchestrator, JobOrchestratorSetup } = require('../dist/job-orchestrator.js');
const { JobOrchestrer } = require('../dist/JobOrchestrer.js');
const { OrchestratorKafkaRuntime } = require('../dist/kafka/orchestrator-kafka.runtime.js');
const { OrchestratorTopicProvisioner } = require('../dist/kafka/topic-provisioner.js');
const { OrchestratorConfig } = require('../dist/config/orchestrator.config.js');

test.beforeEach(() => {
  JobOrchestratorSetup.init({
    kafkaBrokers: ['localhost:9092'],
    service: 'payments-service',
  });
});

test.afterEach(() => {
  OrchestratorKafkaRuntime.resetForTests();
  OrchestratorTopicProvisioner.resetForTests();
  OrchestratorConfig.resetForTests();
});

test('JobOrchestrator.register publishes registration and executes the lifecycle pipeline in order', async () => {
  const events = [];
  let subscribedTopic;
  let subscribedHandler;

  const originalPublishRegistration = OrchestratorKafkaRuntime.publishRegistration;
  const originalSubscribeToJobTopic = OrchestratorKafkaRuntime.subscribeToJobTopic;
  const originalPublishLifecycleEvent = OrchestratorKafkaRuntime.publishLifecycleEvent;
  const originalEnsureMainTopic = OrchestratorTopicProvisioner.ensureMainTopic;
  const originalEnsureJobTopics = OrchestratorTopicProvisioner.ensureJobTopics;

  OrchestratorTopicProvisioner.ensureMainTopic = async () => {
    events.push({ type: 'ensureMainTopic' });
  };

  OrchestratorTopicProvisioner.ensureJobTopics = async (topic) => {
    events.push({ type: 'ensureJobTopics', topic });
  };

  OrchestratorKafkaRuntime.publishRegistration = async (message) => {
    events.push({ type: 'registration', message });
  };

  OrchestratorKafkaRuntime.subscribeToJobTopic = async (topic, handler) => {
    subscribedTopic = topic;
    subscribedHandler = handler;
  };

  OrchestratorKafkaRuntime.publishLifecycleEvent = async (topic, event, payload) => {
    events.push({ type: 'lifecycle', topic, event, payload });
  };

  try {
    await JobOrchestrator.register({
      topic: 'invoice.generate',
      handler: async (payload) => {
        events.push({ type: 'handler', payload });
      },
      onStart: async (payload) => {
        events.push({ type: 'onStart', payload });
      },
      onFinish: async (payload) => {
        events.push({ type: 'onFinish', payload });
      },
    });

    assert.equal(subscribedTopic, 'invoice.generate');
    assert.equal(events[0].type, 'ensureMainTopic');
    assert.equal(events[1].type, 'registration');
    assert.deepEqual(events[1].message, {
      topic: 'invoice.generate',
      service: 'payments-service',
    });
    assert.deepEqual(events[2], { type: 'ensureJobTopics', topic: 'invoice.generate' });

    await subscribedHandler({ amount: 250 });

    assert.deepEqual(events.slice(3), [
      { type: 'onStart', payload: { amount: 250 } },
      { type: 'lifecycle', topic: 'invoice.generate', event: 'start', payload: { amount: 250 } },
      { type: 'handler', payload: { amount: 250 } },
      { type: 'onFinish', payload: { amount: 250 } },
      { type: 'lifecycle', topic: 'invoice.generate', event: 'end', payload: { amount: 250 } },
    ]);
  } finally {
    OrchestratorKafkaRuntime.publishRegistration = originalPublishRegistration;
    OrchestratorKafkaRuntime.subscribeToJobTopic = originalSubscribeToJobTopic;
    OrchestratorKafkaRuntime.publishLifecycleEvent = originalPublishLifecycleEvent;
    OrchestratorTopicProvisioner.ensureMainTopic = originalEnsureMainTopic;
    OrchestratorTopicProvisioner.ensureJobTopics = originalEnsureJobTopics;
  }
});

test('JobOrchestrer.Job keeps backward compatibility with the legacy function field', async () => {
  const calls = [];
  const originalRegister = JobOrchestrator.register;

  JobOrchestrator.register = async (definition) => {
    calls.push(definition);
  };

  try {
    const legacyHandler = async () => {};
    const onStart = async () => {};
    const onFinish = async () => {};

    await JobOrchestrer.Job({
      topic: 'legacy.topic',
      function: legacyHandler,
      onStart,
      onFinish,
    });

    assert.equal(calls.length, 1);
    assert.equal(calls[0].topic, 'legacy.topic');
    assert.equal(calls[0].handler, legacyHandler);
    assert.equal(calls[0].onStart, onStart);
    assert.equal(calls[0].onFinish, onFinish);
  } finally {
    JobOrchestrator.register = originalRegister;
  }
});

test('JobOrchestrator.register publishes a fail event when the handler throws', async () => {
  const events = [];
  let subscribedHandler;

  const originalPublishRegistration = OrchestratorKafkaRuntime.publishRegistration;
  const originalSubscribeToJobTopic = OrchestratorKafkaRuntime.subscribeToJobTopic;
  const originalPublishLifecycleEvent = OrchestratorKafkaRuntime.publishLifecycleEvent;
  const originalEnsureMainTopic = OrchestratorTopicProvisioner.ensureMainTopic;
  const originalEnsureJobTopics = OrchestratorTopicProvisioner.ensureJobTopics;

  OrchestratorTopicProvisioner.ensureMainTopic = async () => {};
  OrchestratorTopicProvisioner.ensureJobTopics = async () => {};
  OrchestratorKafkaRuntime.publishRegistration = async () => {};
  OrchestratorKafkaRuntime.subscribeToJobTopic = async (_topic, handler) => {
    subscribedHandler = handler;
  };
  OrchestratorKafkaRuntime.publishLifecycleEvent = async (topic, event, payload) => {
    events.push({ topic, event, payload });
  };

  try {
    await JobOrchestrator.register({
      topic: 'invoice.generate',
      handler: async () => {
        throw new Error('handler exploded');
      },
    });

    await assert.rejects(
      () => subscribedHandler({ executionId: 'exec-1', payload: { id: 1 } }),
      /handler exploded/,
    );

    assert.deepEqual(events, [
      {
        topic: 'invoice.generate',
        event: 'start',
        payload: { executionId: 'exec-1', payload: { id: 1 } },
      },
      {
        topic: 'invoice.generate',
        event: 'fail',
        payload: {
          executionId: 'exec-1',
          payload: { id: 1 },
          errorMessage: 'handler exploded',
        },
      },
    ]);
  } finally {
    OrchestratorKafkaRuntime.publishRegistration = originalPublishRegistration;
    OrchestratorKafkaRuntime.subscribeToJobTopic = originalSubscribeToJobTopic;
    OrchestratorKafkaRuntime.publishLifecycleEvent = originalPublishLifecycleEvent;
    OrchestratorTopicProvisioner.ensureMainTopic = originalEnsureMainTopic;
    OrchestratorTopicProvisioner.ensureJobTopics = originalEnsureJobTopics;
  }
});
