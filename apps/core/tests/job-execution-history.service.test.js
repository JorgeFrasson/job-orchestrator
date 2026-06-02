const test = require('node:test');
const assert = require('node:assert/strict');

const { JobExecutionHistoryService } = require('../build/src/jobs/job-execution-history.service.js');
const { createAsyncSpy } = require('./helpers.js');

test('JobExecutionHistoryService records start and end for the same execution', async () => {
  const jobModel = {
    findOne: createAsyncSpy(async () => ({ id: 1, topic: 'job-a' })),
  };

  let existingExecution = null;
  const createdExecutions = [];
  const jobExecutionModel = {
    findOne: createAsyncSpy(async () => existingExecution),
    create: createAsyncSpy(async (payload) => {
      existingExecution = {
        ...payload,
        update: createAsyncSpy(async (changes) => Object.assign(existingExecution, changes)),
      };
      createdExecutions.push(existingExecution);
      return existingExecution;
    }),
    findAll: createAsyncSpy(async () => []),
  };

  const service = new JobExecutionHistoryService(jobModel, jobExecutionModel);

  await service.recordLifecycleEvent('job-a', 'start', {
    executionId: 'exec-1',
    timestamp: 10,
    payload: { source: 'manual' },
  });

  await service.recordLifecycleEvent('job-a', 'end', {
    executionId: 'exec-1',
    timestamp: 20,
    payload: { source: 'manual' },
  });

  assert.equal(createdExecutions.length, 1);
  assert.equal(existingExecution.status, 'succeeded');
  assert.equal(existingExecution.finishedAt.toISOString(), new Date(20).toISOString());
});

test('JobExecutionHistoryService records failed execution and lists executions', async () => {
  const jobModel = {
    findOne: createAsyncSpy(async () => ({ id: 3, topic: 'job-b' })),
  };

  const jobExecutionModel = {
    findOne: createAsyncSpy(async () => null),
    create: createAsyncSpy(async (payload) => payload),
    findAll: createAsyncSpy(async () => [{ executionId: 'exec-2', status: 'failed' }]),
  };

  const service = new JobExecutionHistoryService(jobModel, jobExecutionModel);

  await service.recordLifecycleEvent('job-b', 'fail', {
    executionId: 'exec-2',
    timestamp: 30,
    payload: { source: 'scheduler' },
    errorMessage: 'boom',
  });

  const result = await service.listExecutions('job-b');

  assert.equal(jobExecutionModel.create.calledTimes(), 1);
  assert.equal(jobExecutionModel.create.lastCall()[0].status, 'failed');
  assert.equal(jobExecutionModel.create.lastCall()[0].errorMessage, 'boom');
  assert.deepEqual(result, [{ executionId: 'exec-2', status: 'failed' }]);
});

test('JobExecutionHistoryService tolerates duplicated completion events for the same execution', async () => {
  const jobModel = {
    findOne: createAsyncSpy(async () => ({ id: 9, topic: 'job-c' })),
  };

  let existingExecution = null;
  const jobExecutionModel = {
    findOne: createAsyncSpy(async () => existingExecution),
    create: createAsyncSpy(async (payload) => {
      if (!existingExecution) {
        const error = new Error('duplicate execution');
        error.name = 'SequelizeUniqueConstraintError';
        existingExecution = {
          executionId: payload.executionId,
          status: 'running',
          update: createAsyncSpy(async (changes) => Object.assign(existingExecution, changes)),
        };
        throw error;
      }

      return payload;
    }),
    findAll: createAsyncSpy(async () => []),
  };

  const service = new JobExecutionHistoryService(jobModel, jobExecutionModel);

  const result = await service.recordLifecycleEvent('job-c', 'end', {
    executionId: 'exec-3',
    timestamp: 40,
    payload: { source: 'worker' },
  });

  assert.equal(jobExecutionModel.create.calledTimes(), 1);
  assert.equal(existingExecution.status, 'succeeded');
  assert.equal(existingExecution.update.calledTimes(), 1);
  assert.equal(result, existingExecution);
});
