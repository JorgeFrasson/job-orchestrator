const test = require('node:test');
const assert = require('node:assert/strict');

const { JobIntegrationsService } = require('../build/src/jobs/job-integrations.service.js');
const { createAsyncSpy } = require('./helpers.js');

function createJobWithIntegrations(integrations) {
  return {
    topic: 'job-a',
    config: { integrations },
    toJSON() {
      return { topic: 'job-a', service: 'billing' };
    },
  };
}

test('JobIntegrationsService returns when the job has no integrations', async () => {
  const model = {
    findOne: createAsyncSpy(async () => ({ topic: 'job-a', config: { integrations: [] } })),
  };
  const service = new JobIntegrationsService(model);

  await service.executeLifecycleEvent('job-a', 'onStart', { id: 1 });
  assert.equal(model.findOne.calledTimes(), 1);
});

test('JobIntegrationsService executes webhook integrations for the matching event', async () => {
  const originalFetch = global.fetch;
  const fetchCalls = [];
  global.fetch = async (...args) => {
    fetchCalls.push(args);
    return { ok: true, status: 200, statusText: 'OK' };
  };

  const model = {
    findOne: createAsyncSpy(async () =>
      createJobWithIntegrations([
        {
          id: 'webhook-1',
          type: 'webhook',
          event: 'onStart',
          config: {
            url: 'https://example.test/hook',
            method: 'POST',
            headers: { Authorization: 'Bearer token' },
            payload: '{"topic":"{{job.topic}}","event":"{{event}}","payload":{{payload}}}',
          },
        },
        {
          id: 'webhook-2',
          type: 'webhook',
          event: 'onFinish',
          config: { url: 'https://example.test/finish' },
        },
      ]),
    ),
  };

  try {
    const service = new JobIntegrationsService(model);
    await service.executeLifecycleEvent('job-a', 'onStart', { id: 1 });

    assert.equal(fetchCalls.length, 1);
    assert.equal(fetchCalls[0][0], 'https://example.test/hook');
    assert.deepEqual(fetchCalls[0][1], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
      },
      body: '{"topic":"job-a","event":"onStart","payload":{"id":1}}',
    });
  } finally {
    global.fetch = originalFetch;
  }
});

test('JobIntegrationsService executes lambda integrations with job, payload and context', async () => {
  const captured = [];
  global.__integrationCapture = captured;

  const model = {
    findOne: createAsyncSpy(async () =>
      createJobWithIntegrations([
        {
          id: 'lambda-1',
          type: 'lambda',
          event: 'onFinish',
          config: {
            code: 'globalThis.__integrationCapture.push({ job, payload, context });',
          },
        },
      ]),
    ),
  };

  try {
    const service = new JobIntegrationsService(model);
    await service.executeLifecycleEvent('job-a', 'onFinish', { id: 99 });

    assert.equal(captured.length, 1);
    assert.equal(captured[0].job.topic, 'job-a');
    assert.deepEqual(captured[0].payload, { id: 99 });
    assert.equal(captured[0].context.event, 'onFinish');
    assert.equal(captured[0].context.integrationId, 'lambda-1');
    assert.equal(typeof captured[0].context.timestamp, 'number');
  } finally {
    delete global.__integrationCapture;
  }
});
