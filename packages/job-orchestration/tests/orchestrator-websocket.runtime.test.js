const test = require('node:test');
const assert = require('node:assert/strict');

const { OrchestratorConfig } = require('../dist/config/orchestrator.config.js');
const { OrchestratorWebSocketRuntime } = require('../dist/websocket/orchestrator-websocket.runtime.js');

test.beforeEach(() => {
  OrchestratorConfig.init({
    service: 'example-service',
    coreUrl: 'ws://localhost:3000',
  });
});

test.afterEach(async () => {
  await OrchestratorWebSocketRuntime.resetForTests();
  OrchestratorConfig.resetForTests();
});

test('publishRegistration sends a register_job message through the socket', async () => {
  const sentMessages = [];
  const originalConnect = OrchestratorWebSocketRuntime.connect;

  OrchestratorWebSocketRuntime.connect = async () => ({
    send(payload) {
      sentMessages.push(JSON.parse(payload));
    },
    readyState: 1,
    on() {},
    once() {},
    close() {},
  });

  try {
    await OrchestratorWebSocketRuntime.publishRegistration(
      {
        topic: 'invoice.generate',
        service: 'example-service',
      },
      async () => {},
    );

    assert.deepEqual(sentMessages, [
      {
        type: 'register_job',
        topic: 'invoice.generate',
        service: 'example-service',
      },
    ]);
  } finally {
    OrchestratorWebSocketRuntime.connect = originalConnect;
  }
});

test('publishLifecycleEvent sends lifecycle messages with executionId', async () => {
  const sentMessages = [];
  const originalConnect = OrchestratorWebSocketRuntime.connect;

  OrchestratorWebSocketRuntime.connect = async () => ({
    send(payload) {
      sentMessages.push(JSON.parse(payload));
    },
    readyState: 1,
    on() {},
    once() {},
    close() {},
  });

  try {
    await OrchestratorWebSocketRuntime.publishLifecycleEvent('invoice.generate', 'start', {
      executionId: 'exec-1',
      payload: { id: 1 },
    });

    assert.equal(sentMessages[0].type, 'lifecycle_event');
    assert.equal(sentMessages[0].topic, 'invoice.generate');
    assert.equal(sentMessages[0].event, 'start');
    assert.equal(sentMessages[0].executionId, 'exec-1');
  } finally {
    OrchestratorWebSocketRuntime.connect = originalConnect;
  }
});

test('handleMessage dispatches execute_job messages to the topic handler', async () => {
  const receivedPayloads = [];
  const originalConnect = OrchestratorWebSocketRuntime.connect;

  OrchestratorWebSocketRuntime.connect = async () => ({
    send() {},
    readyState: 1,
    on() {},
    once() {},
    close() {},
  });

  try {
    await OrchestratorWebSocketRuntime.publishRegistration(
      {
        topic: 'invoice.generate',
        service: 'example-service',
      },
      async (payload) => {
        receivedPayloads.push(payload);
      },
    );

    await OrchestratorWebSocketRuntime.handleMessage(
      JSON.stringify({
        type: 'execute_job',
        topic: 'invoice.generate',
        executionId: 'exec-1',
        payload: { id: 10 },
        metadata: { trigger: 'manual' },
      }),
    );

    assert.deepEqual(receivedPayloads, [
      {
        executionId: 'exec-1',
        payload: { id: 10 },
        metadata: { trigger: 'manual' },
      },
    ]);
  } finally {
    OrchestratorWebSocketRuntime.connect = originalConnect;
  }
});
