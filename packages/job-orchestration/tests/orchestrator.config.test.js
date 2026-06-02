const test = require('node:test');
const assert = require('node:assert/strict');

const { OrchestratorConfig } = require('../dist/config/orchestrator.config.js');
const { OrchestratorWebSocketRuntime } = require('../dist/websocket/orchestrator-websocket.runtime.js');

test.afterEach(async () => {
  await OrchestratorWebSocketRuntime.resetForTests();
  OrchestratorConfig.resetForTests();
});

test('OrchestratorConfig throws when accessed before initialization', () => {
  assert.throws(() => OrchestratorConfig.getOptions(), /has not been initialized yet/);
});

test('OrchestratorConfig normalizes defaults for the WebSocket transport', () => {
  OrchestratorConfig.init({
    service: 'billing-service',
    coreUrl: 'http://localhost:3000',
  });

  assert.deepEqual(OrchestratorConfig.getOptions(), {
    service: 'billing-service',
    coreUrl: 'ws://localhost:3000',
    reconnectIntervalMs: 3000,
  });
});
