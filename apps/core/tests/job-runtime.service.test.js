const test = require('node:test');
const assert = require('node:assert/strict');

const { JobRuntimeService } = require('../build/src/jobs/job-runtime.service.js');
const { createAsyncSpy, assertCalledOnceWith } = require('./helpers.js');

test('JobRuntimeService ensures topic infrastructure in the expected order', async () => {
  const gateway = {
    sendToJob: createAsyncSpy(),
  };

  const runtime = new JobRuntimeService(gateway);
  await runtime.ensureTopicInfrastructure('invoice.generate');
  assert.equal(gateway.sendToJob.calledTimes(), 0);
});

test('JobRuntimeService sends registration confirmation and manual start messages', async () => {
  const gateway = {
    sendToJob: createAsyncSpy(),
  };

  const runtime = new JobRuntimeService(gateway);

  await runtime.sendRegistrationConfirmation('invoice.generate');
  await runtime.startJob('invoice.generate', { id: 10 }, { scheduled: true });

  assert.equal(gateway.sendToJob.calledTimes(), 1);
  assertCalledOnceWith(gateway.sendToJob, 'invoice.generate', { id: 10 }, { scheduled: true });
});
