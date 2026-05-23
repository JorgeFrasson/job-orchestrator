const test = require('node:test');
const assert = require('node:assert/strict');

const { JobLifecycleConsumerService } = require('../build/src/jobs/job-lifecycle-consumer.service.js');
const { createAsyncSpy } = require('./helpers.js');

test('JobLifecycleConsumerService registers start and end consumers and delegates to integrations', async () => {
  const runHandlers = [];
  const subscriptions = [];
  const consumers = [];

  const integrationsService = {
    executeLifecycleEvent: createAsyncSpy(),
  };
  const historyService = {
    recordLifecycleEvent: createAsyncSpy(),
  };

  const service = new JobLifecycleConsumerService(integrationsService, historyService);
  service.kafka = {
    consumer() {
      const consumer = {
        connect: createAsyncSpy(),
        subscribe: createAsyncSpy(async (subscription) => {
          subscriptions.push(subscription);
        }),
        run: createAsyncSpy(async ({ eachMessage }) => {
          runHandlers.push(eachMessage);
        }),
      };
      consumers.push(consumer);
      return consumer;
    },
  };

  await service.registerLifecycleConsumersForJob('job-a');
  await service.registerLifecycleConsumersForJob('job-a');

  assert.equal(consumers.length, 3);
  assert.deepEqual(subscriptions, [
    { topic: 'job-a-start', fromBeginning: false },
    { topic: 'job-a-end', fromBeginning: false },
    { topic: 'job-a-fail', fromBeginning: false },
  ]);

  await runHandlers[0]({ message: { value: Buffer.from(JSON.stringify({ started: true })) } });
  await runHandlers[1]({ message: { value: Buffer.from(JSON.stringify({ ended: true })) } });
  await runHandlers[2]({ message: { value: Buffer.from(JSON.stringify({ failed: true })) } });

  assert.deepEqual(integrationsService.executeLifecycleEvent.calls, [
    ['job-a', 'onStart', { started: true }],
    ['job-a', 'onFinish', { ended: true }],
  ]);
  assert.deepEqual(historyService.recordLifecycleEvent.calls, [
    ['job-a', 'start', { started: true }],
    ['job-a', 'end', { ended: true }],
    ['job-a', 'fail', { failed: true }],
  ]);
});
