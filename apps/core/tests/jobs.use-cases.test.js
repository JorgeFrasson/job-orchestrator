const test = require('node:test');
const assert = require('node:assert/strict');

const { GetJobUseCase } = require('../build/src/jobs/use-cases/get-job.use-case.js');
const { ListJobsUseCase } = require('../build/src/jobs/use-cases/list-jobs.use-case.js');
const { LoadExistingJobsUseCase } = require('../build/src/jobs/use-cases/load-existing-jobs.use-case.js');
const { RegisterJobUseCase } = require('../build/src/jobs/use-cases/register-job.use-case.js');
const { TriggerJobManuallyUseCase } = require('../build/src/jobs/use-cases/trigger-job-manually.use-case.js');
const { UpdateJobConfigUseCase } = require('../build/src/jobs/use-cases/update-job-config.use-case.js');
const { createAsyncSpy, createSyncSpy, assertCalledOnceWith } = require('./helpers.js');

test('GetJobUseCase returns the job and throws when missing', async () => {
  const foundJob = { topic: 'job-a' };
  const model = {
    findOne: createAsyncSpy(async ({ where }) => (where.topic === 'job-a' ? foundJob : null)),
  };
  const useCase = new GetJobUseCase(model);

  assert.equal(await useCase.execute('job-a'), foundJob);
  await assert.rejects(() => useCase.execute('missing'), /Job missing not found/);
});

test('ListJobsUseCase queries jobs with config and ordering', async () => {
  const result = [{ topic: 'job-a' }];
  const model = { findAll: createAsyncSpy(async () => result) };
  const useCase = new ListJobsUseCase(model);

  assert.equal(await useCase.execute(), result);
  assert.deepEqual(model.findAll.lastCall()[0], {
    include: ['config'],
    order: [['createdAt', 'DESC']],
  });
});

test('LoadExistingJobsUseCase loads database jobs into the in-memory registry', async () => {
  const jobs = [
    { topic: 'job-a', service: 'billing' },
    { topic: 'job-b', service: 'payments' },
  ];
  const model = { findAll: createAsyncSpy(async () => jobs) };
  const registry = { rememberMany: createSyncSpy() };
  const useCase = new LoadExistingJobsUseCase(model, registry);

  const count = await useCase.execute();
  assert.equal(count, 2);
  assertCalledOnceWith(registry.rememberMany, jobs);
});

test('RegisterJobUseCase short-circuits already loaded jobs', async () => {
  const useCase = new RegisterJobUseCase(
    { findOne: createAsyncSpy(), create: createAsyncSpy() },
    { has: () => true, remember: createSyncSpy() },
    { ensureTopicInfrastructure: createAsyncSpy(), sendRegistrationConfirmation: createAsyncSpy() },
    { updateSchedule: createAsyncSpy() },
  );

  const result = await useCase.execute({ topic: 'job-a', service: 'billing' });
  assert.deepEqual(result, { status: 'already_registered', topic: 'job-a' });
});

test('RegisterJobUseCase creates a new job and confirms registration', async () => {
  const createdJob = { id: 1, topic: 'job-a', service: 'billing' };
  const model = {
    findOne: createAsyncSpy(async () => null),
    create: createAsyncSpy(async () => createdJob),
  };
  const registry = { has: () => false, remember: createSyncSpy() };
  const runtime = {
    ensureTopicInfrastructure: createAsyncSpy(),
    sendRegistrationConfirmation: createAsyncSpy(),
  };
  const scheduler = { updateSchedule: createAsyncSpy() };
  const useCase = new RegisterJobUseCase(model, registry, runtime, scheduler);

  const result = await useCase.execute({ topic: 'job-a', service: 'billing' });

  assert.deepEqual(result, { status: 'ok', topic: 'job-a', isNew: true });
  assertCalledOnceWith(model.create, { topic: 'job-a', service: 'billing' });
  assertCalledOnceWith(runtime.ensureTopicInfrastructure, 'job-a');
  assertCalledOnceWith(registry.remember, { topic: 'job-a', service: 'billing' });
  assertCalledOnceWith(runtime.sendRegistrationConfirmation, 'job-a');
});

test('RegisterJobUseCase updates an existing job and reapplies cron schedule', async () => {
  const job = {
    config: { cron: '0 * * * *' },
    update: createAsyncSpy(),
  };
  const model = {
    findOne: createAsyncSpy(async () => job),
    create: createAsyncSpy(),
  };
  const registry = { has: () => false, remember: createSyncSpy() };
  const runtime = {
    ensureTopicInfrastructure: createAsyncSpy(),
    sendRegistrationConfirmation: createAsyncSpy(),
  };
  const scheduler = { updateSchedule: createAsyncSpy() };
  const useCase = new RegisterJobUseCase(model, registry, runtime, scheduler);

  const result = await useCase.execute({ topic: 'job-a', service: 'billing-v2' });

  assert.deepEqual(result, { status: 'ok', topic: 'job-a', isNew: false });
  assertCalledOnceWith(job.update, { service: 'billing-v2' });
  assertCalledOnceWith(scheduler.updateSchedule, 'job-a', '0 * * * *');
});

test('TriggerJobManuallyUseCase rejects unknown jobs and starts known jobs', async () => {
  const runtime = { startJob: createAsyncSpy() };
  const missingUseCase = new TriggerJobManuallyUseCase({ has: () => false }, runtime);
  await assert.rejects(() => missingUseCase.execute('missing'), /Job missing is not registered/);

  const useCase = new TriggerJobManuallyUseCase({ has: () => true }, runtime);
  await useCase.execute('job-a', { id: 10 });
  assertCalledOnceWith(runtime.startJob, 'job-a', { id: 10 });
});

test('UpdateJobConfigUseCase updates existing config and reschedules cron changes', async () => {
  const config = { update: createAsyncSpy() };
  const job = { id: 1, config: undefined };
  const updatedJob = { id: 1, topic: 'job-a' };
  const jobModel = {
    findOne: createAsyncSpy(async () => (jobModel.findOne.calledTimes() === 1 ? job : updatedJob)),
  };
  const jobConfigModel = {
    findOne: createAsyncSpy(async () => config),
    create: createAsyncSpy(),
  };
  const scheduler = { updateSchedule: createAsyncSpy() };
  const useCase = new UpdateJobConfigUseCase(jobModel, jobConfigModel, scheduler);

  const result = await useCase.execute('job-a', { cron: '*/5 * * * * *', retries: 3 });

  assert.equal(result, updatedJob);
  assertCalledOnceWith(config.update, { cron: '*/5 * * * * *', retries: 3 });
  assertCalledOnceWith(scheduler.updateSchedule, 'job-a', '*/5 * * * * *');
});

test('UpdateJobConfigUseCase creates config when missing', async () => {
  const job = { id: 7, config: undefined };
  const refreshedJob = { id: 7, topic: 'job-b' };
  const jobModel = {
    findOne: createAsyncSpy(async () => (jobModel.findOne.calledTimes() === 1 ? job : refreshedJob)),
  };
  const jobConfigModel = {
    findOne: createAsyncSpy(async () => null),
    create: createAsyncSpy(async () => undefined),
  };
  const scheduler = { updateSchedule: createAsyncSpy() };
  const useCase = new UpdateJobConfigUseCase(jobModel, jobConfigModel, scheduler);

  const result = await useCase.execute('job-b', { retries: 5 });

  assert.equal(result, refreshedJob);
  assertCalledOnceWith(jobConfigModel.create, { retries: 5, jobId: 7 });
  assert.equal(scheduler.updateSchedule.calledTimes(), 0);
});
