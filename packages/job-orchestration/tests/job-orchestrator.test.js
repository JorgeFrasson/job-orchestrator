const test = require('node:test');
const assert = require('node:assert/strict');

const { JobOrchestrator, JobOrchestratorSetup } = require('../dist/job-orchestrator.js');
const { JobOrchestrer } = require('../dist/JobOrchestrer.js');
const { OrchestratorConfig } = require('../dist/config/orchestrator.config.js');
const { OrchestratorWebSocketRuntime } = require('../dist/websocket/orchestrator-websocket.runtime.js');

test.beforeEach(() => {
  JobOrchestratorSetup.init({
    service: 'payments-service',
    coreUrl: 'ws://localhost:3000',
  });
});

test.afterEach(async () => {
  await OrchestratorWebSocketRuntime.resetForTests();
  OrchestratorConfig.resetForTests();
});

test('JobOrchestrator.register registers the job and executes the lifecycle pipeline in order', async () => {
  const events = [];
  let registeredMessage;
  let registeredHandler;
  const originalPublishRegistration = OrchestratorWebSocketRuntime.publishRegistration;
  const originalPublishLifecycleEvent = OrchestratorWebSocketRuntime.publishLifecycleEvent;

  OrchestratorWebSocketRuntime.publishRegistration = async (message, handler) => {
    registeredMessage = message;
    registeredHandler = handler;
  };

  OrchestratorWebSocketRuntime.publishLifecycleEvent = async (topic, event, payload) => {
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

    assert.deepEqual(registeredMessage, {
      topic: 'invoice.generate',
      service: 'payments-service',
    });

    await registeredHandler({ executionId: 'exec-1', payload: { amount: 250 } });

    assert.deepEqual(events, [
      {
        type: 'onStart',
        payload: { executionId: 'exec-1', payload: { amount: 250 } },
      },
      {
        type: 'lifecycle',
        topic: 'invoice.generate',
        event: 'start',
        payload: { executionId: 'exec-1', payload: { amount: 250 } },
      },
      {
        type: 'handler',
        payload: { executionId: 'exec-1', payload: { amount: 250 } },
      },
      {
        type: 'onFinish',
        payload: { executionId: 'exec-1', payload: { amount: 250 } },
      },
      {
        type: 'lifecycle',
        topic: 'invoice.generate',
        event: 'end',
        payload: { executionId: 'exec-1', payload: { amount: 250 } },
      },
    ]);
  } finally {
    OrchestratorWebSocketRuntime.publishRegistration = originalPublishRegistration;
    OrchestratorWebSocketRuntime.publishLifecycleEvent = originalPublishLifecycleEvent;
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
  let registeredHandler;
  const originalPublishRegistration = OrchestratorWebSocketRuntime.publishRegistration;
  const originalPublishLifecycleEvent = OrchestratorWebSocketRuntime.publishLifecycleEvent;

  OrchestratorWebSocketRuntime.publishRegistration = async (_message, handler) => {
    registeredHandler = handler;
  };

  OrchestratorWebSocketRuntime.publishLifecycleEvent = async (topic, event, payload) => {
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
      () => registeredHandler({ executionId: 'exec-1', payload: { id: 1 } }),
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
    OrchestratorWebSocketRuntime.publishRegistration = originalPublishRegistration;
    OrchestratorWebSocketRuntime.publishLifecycleEvent = originalPublishLifecycleEvent;
  }
});
