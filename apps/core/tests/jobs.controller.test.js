const test = require('node:test');
const assert = require('node:assert/strict');

const { JobsController } = require('../build/src/jobs/jobs.controller.js');
const { createAsyncSpy, assertCalledOnceWith } = require('./helpers.js');

test('JobsController delegates list and detail operations to JobsService', async () => {
  const jobsService = {
    handleJobRegistration: createAsyncSpy(),
    getAllJobs: createAsyncSpy(async () => ['job-a']),
    getJob: createAsyncSpy(async () => ({ topic: 'job-a' })),
    listExecutions: createAsyncSpy(async () => [{ executionId: 'exec-1' }]),
    triggerJobManually: createAsyncSpy(),
    updateJobConfig: createAsyncSpy(),
  };
  const controller = new JobsController(jobsService);

  assert.deepEqual(await controller.listJobs(), ['job-a']);
  assert.deepEqual(await controller.getJob('job-a'), { topic: 'job-a' });
  assert.deepEqual(await controller.listExecutions('job-a'), [{ executionId: 'exec-1' }]);

  assertCalledOnceWith(jobsService.getAllJobs);
  assertCalledOnceWith(jobsService.getJob, 'job-a');
  assertCalledOnceWith(jobsService.listExecutions, 'job-a');
});

test('JobsController normalizes manual start payload and returns API response', async () => {
  const jobsService = {
    handleJobRegistration: createAsyncSpy(),
    getAllJobs: createAsyncSpy(),
    getJob: createAsyncSpy(),
    listExecutions: createAsyncSpy(),
    triggerJobManually: createAsyncSpy(),
    updateJobConfig: createAsyncSpy(),
  };
  const controller = new JobsController(jobsService);

  const response = await controller.startJob('invoice.generate', { payload: { id: 1 } });

  assert.deepEqual(response, {
    status: 'started',
    topic: 'invoice.generate',
    sent: true,
  });
  assertCalledOnceWith(jobsService.triggerJobManually, 'invoice.generate', { id: 1 });
});

test('JobsController forwards config updates', async () => {
  const jobsService = {
    getAllJobs: createAsyncSpy(),
    getJob: createAsyncSpy(),
    listExecutions: createAsyncSpy(),
    triggerJobManually: createAsyncSpy(),
    updateJobConfig: createAsyncSpy(async () => ({ topic: 'invoice.generate' })),
  };
  const controller = new JobsController(jobsService);

  const updated = await controller.updateJobConfig('invoice.generate', { cron: '0 * * * *' });

  assert.deepEqual(updated, { topic: 'invoice.generate' });
  assertCalledOnceWith(jobsService.updateJobConfig, 'invoice.generate', { cron: '0 * * * *' });
});
