const test = require('node:test');
const assert = require('node:assert/strict');

const { JobConsumerService } = require('../build/src/jobs/jobs-consumer.service.js');
const { createAsyncSpy } = require('./helpers.js');

test('JobConsumerService registers one consumer per topic and parses JSON messages', async () => {
  let runHandler;
  const consumer = {
    connect: createAsyncSpy(),
    subscribe: createAsyncSpy(),
    run: createAsyncSpy(async ({ eachMessage }) => {
      runHandler = eachMessage;
    }),
    disconnect: createAsyncSpy(),
  };

  const service = new JobConsumerService();
  service.kafka = {
    consumer() {
      return consumer;
    },
  };

  const handledPayloads = [];
  await service.registerConsumerForJob('job-a', async (payload) => {
    handledPayloads.push(payload);
  });
  await service.registerConsumerForJob('job-a', async () => {
    throw new Error('should not register twice');
  });

  assert.equal(consumer.connect.calledTimes(), 1);
  assert.deepEqual(consumer.subscribe.lastCall()[0], { topic: 'job-a', fromBeginning: false });

  await runHandler({
    message: {
      value: Buffer.from(JSON.stringify({ command: 'start', payload: { id: 1 } })),
    },
  });

  await runHandler({
    message: {
      value: Buffer.from('not-json'),
    },
  });

  assert.deepEqual(handledPayloads, [{ command: 'start', payload: { id: 1 } }]);

  await service.onModuleDestroy();
  assert.equal(consumer.disconnect.calledTimes(), 1);
});
