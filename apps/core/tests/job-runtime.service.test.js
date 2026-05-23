const test = require('node:test');
const assert = require('node:assert/strict');

const { JobRuntimeService } = require('../build/src/jobs/job-runtime.service.js');
const { createAsyncSpy, assertCalledOnceWith } = require('./helpers.js');

test('JobRuntimeService ensures topic infrastructure in the expected order', async () => {
  const producer = {
    registerProducerForTopic: createAsyncSpy(),
    sendToJobTopic: createAsyncSpy(),
  };
  const consumer = {
    registerConsumerForJob: createAsyncSpy(),
  };
  const lifecycleConsumer = {
    registerLifecycleConsumersForJob: createAsyncSpy(),
  };
  const topicProvisioning = {
    ensureJobTopics: createAsyncSpy(),
  };

  const runtime = new JobRuntimeService(
    producer,
    consumer,
    lifecycleConsumer,
    topicProvisioning,
  );
  await runtime.ensureTopicInfrastructure('invoice.generate');

  assertCalledOnceWith(topicProvisioning.ensureJobTopics, 'invoice.generate');
  assertCalledOnceWith(producer.registerProducerForTopic, 'invoice.generate');
  assert.equal(consumer.registerConsumerForJob.calledTimes(), 1);
  assert.equal(typeof consumer.registerConsumerForJob.lastCall()[1], 'function');
  assertCalledOnceWith(lifecycleConsumer.registerLifecycleConsumersForJob, 'invoice.generate');
});

test('JobRuntimeService sends registration confirmation and manual start messages', async () => {
  const producer = {
    registerProducerForTopic: createAsyncSpy(),
    sendToJobTopic: createAsyncSpy(),
  };
  const consumer = { registerConsumerForJob: createAsyncSpy() };
  const lifecycleConsumer = { registerLifecycleConsumersForJob: createAsyncSpy() };
  const topicProvisioning = { ensureJobTopics: createAsyncSpy() };

  const runtime = new JobRuntimeService(
    producer,
    consumer,
    lifecycleConsumer,
    topicProvisioning,
  );

  await runtime.sendRegistrationConfirmation('invoice.generate');
  await runtime.startJob('invoice.generate', { id: 10 }, { scheduled: true });

  assert.equal(producer.sendToJobTopic.calledTimes(), 2);
  assert.equal(producer.sendToJobTopic.calls[0][0], 'invoice.generate');
  assert.equal(producer.sendToJobTopic.calls[0][1].event, 'JOB_REGISTERED');
  assert.equal(producer.sendToJobTopic.calls[1][0], 'invoice.generate');
  assert.equal(producer.sendToJobTopic.calls[1][1].command, 'start');
  assert.deepEqual(producer.sendToJobTopic.calls[1][1].payload, { id: 10 });
  assert.equal(producer.sendToJobTopic.calls[1][1].scheduled, true);
  assert.equal(typeof producer.sendToJobTopic.calls[1][1].executionId, 'string');
});
