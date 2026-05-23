const test = require('node:test');
const assert = require('node:assert/strict');

const { JobsService } = require('../build/src/jobs/jobs.service.js');
const { createAsyncSpy, createSyncSpy, assertCalledOnceWith } = require('./helpers.js');

test('JobsService delegates commands and queries to use cases', async () => {
  const loadExistingJobsUseCase = { execute: createAsyncSpy(async () => 1) };
  const registerJobUseCase = { execute: createAsyncSpy(async (dto) => ({ status: 'ok', topic: dto.topic })) };
  const listJobsUseCase = { execute: createAsyncSpy(async () => ['job-a']) };
  const getJobUseCase = { execute: createAsyncSpy(async (topic) => ({ topic })) };
  const updateJobConfigUseCase = { execute: createAsyncSpy(async () => ({ updated: true })) };
  const triggerJobManuallyUseCase = { execute: createAsyncSpy() };
  const registry = { list: createSyncSpy(() => [{ topic: 'job-a', service: 'billing' }]) };
  const executionHistoryService = { listExecutions: createAsyncSpy(async () => [{ executionId: 'exec-1' }]) };

  const service = new JobsService(
    loadExistingJobsUseCase,
    registerJobUseCase,
    listJobsUseCase,
    getJobUseCase,
    updateJobConfigUseCase,
    triggerJobManuallyUseCase,
    registry,
    executionHistoryService,
  );

  const registerResult = await service.handleJobRegistration({ topic: 'job-a', service: 'billing' });
  const listResult = service.listJobs();
  const allJobs = await service.getAllJobs();
  const oneJob = await service.getJob('job-a');
  const updated = await service.updateJobConfig('job-a', { cron: '* * * * *' });
  const executions = await service.listExecutions('job-a');
  await service.triggerJobManually('job-a', { id: 10 });

  assert.deepEqual(registerResult, { status: 'ok', topic: 'job-a' });
  assert.deepEqual(listResult, [{ topic: 'job-a', service: 'billing' }]);
  assert.deepEqual(allJobs, ['job-a']);
  assert.deepEqual(oneJob, { topic: 'job-a' });
  assert.deepEqual(updated, { updated: true });
  assert.deepEqual(executions, [{ executionId: 'exec-1' }]);

  assertCalledOnceWith(registerJobUseCase.execute, { topic: 'job-a', service: 'billing' });
  assertCalledOnceWith(listJobsUseCase.execute);
  assertCalledOnceWith(getJobUseCase.execute, 'job-a');
  assertCalledOnceWith(updateJobConfigUseCase.execute, 'job-a', { cron: '* * * * *' });
  assertCalledOnceWith(executionHistoryService.listExecutions, 'job-a');
  assertCalledOnceWith(triggerJobManuallyUseCase.execute, 'job-a', { id: 10 });
});

test('JobsService schedules the load-existing-jobs boot hook', async () => {
  const originalSetTimeout = global.setTimeout;
  const timers = [];
  global.setTimeout = (fn, delay) => {
    timers.push({ fn, delay });
    return 1;
  };

  const loadExistingJobsUseCase = { execute: createAsyncSpy(async () => 1) };
  const service = new JobsService(
    loadExistingJobsUseCase,
    { execute: createAsyncSpy() },
    { execute: createAsyncSpy() },
    { execute: createAsyncSpy() },
    { execute: createAsyncSpy() },
    { execute: createAsyncSpy() },
    { list: createSyncSpy(() => []) },
    { listExecutions: createAsyncSpy(async () => []) },
  );

  try {
    await service.onModuleInit();
    assert.equal(timers.length, 1);
    assert.equal(timers[0].delay, 1000);
    await timers[0].fn();
    assert.equal(loadExistingJobsUseCase.execute.calledTimes(), 1);
  } finally {
    global.setTimeout = originalSetTimeout;
  }
});
