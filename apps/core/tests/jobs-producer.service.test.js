const test = require('node:test');
const assert = require('node:assert/strict');

const { JobProducerService } = require('../build/src/jobs/jobs-producer.service.js');
const { createAsyncSpy } = require('./helpers.js');

test('JobProducerService registers one producer per topic and sends serialized messages', async () => {
  const producer = {
    connect: createAsyncSpy(),
    disconnect: createAsyncSpy(),
    send: createAsyncSpy(),
  };

  const service = new JobProducerService();
  service.kafka = {
    producer() {
      return producer;
    },
  };

  await service.registerProducerForTopic('job-a');
  await service.registerProducerForTopic('job-a');
  await service.sendToJobTopic('job-a', { command: 'start', payload: { id: 1 } });
  await service.onModuleDestroy();

  assert.equal(producer.connect.calledTimes(), 1);
  assert.equal(producer.send.calledTimes(), 1);
  assert.deepEqual(producer.send.lastCall()[0], {
    topic: 'job-a',
    messages: [{ value: JSON.stringify({ command: 'start', payload: { id: 1 } }) }],
  });
  assert.equal(producer.disconnect.calledTimes(), 1);
});

test('JobProducerService throws when sending without a registered producer', async () => {
  const service = new JobProducerService();
  await assert.rejects(() => service.sendToJobTopic('missing-topic', {}), /No producer registered/);
});
