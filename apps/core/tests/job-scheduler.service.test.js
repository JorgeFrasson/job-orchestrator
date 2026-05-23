const test = require('node:test');
const assert = require('node:assert/strict');
const cron = require('node-cron');

const { JobSchedulerService } = require('../build/src/jobs/job-scheduler.service.js');
const { createAsyncSpy } = require('./helpers.js');

function createJobModel(jobs = []) {
  return {
    findAll: createAsyncSpy(async () => jobs),
  };
}

test('JobSchedulerService loads persisted jobs and schedules only jobs with cron', async () => {
  const runtime = {
    ensureTopicInfrastructure: createAsyncSpy(),
    startJob: createAsyncSpy(),
  };
  const jobs = [
    {
      get(field) {
        if (field === 'topic') return 'job-a';
        if (field === 'config') return { cron: '*/5 * * * * *' };
      },
    },
    {
      get(field) {
        if (field === 'topic') return 'job-b';
        if (field === 'config') return undefined;
      },
    },
  ];
  const service = new JobSchedulerService(createJobModel(jobs), runtime);

  const originalValidate = cron.validate;
  const originalSchedule = cron.schedule;
  const scheduledTopics = [];

  cron.validate = () => true;
  cron.schedule = (expression, handler) => ({
    start() {
      scheduledTopics.push(expression);
      this.handler = handler;
    },
    stop() {},
  });

  try {
    await service.loadScheduledJobs();
    assert.equal(runtime.ensureTopicInfrastructure.calledTimes(), 2);
    assert.deepEqual(service.getScheduledJobs(), [
      { topic: 'job-a', cronExpression: '*/5 * * * * *' },
    ]);
    assert.deepEqual(scheduledTopics, ['*/5 * * * * *']);
  } finally {
    cron.validate = originalValidate;
    cron.schedule = originalSchedule;
  }
});

test('JobSchedulerService updateSchedule unschedules when cron is removed', async () => {
  const runtime = {
    ensureTopicInfrastructure: createAsyncSpy(),
    startJob: createAsyncSpy(),
  };
  const service = new JobSchedulerService(createJobModel(), runtime);

  const originalValidate = cron.validate;
  const originalSchedule = cron.schedule;
  let stopCalls = 0;

  cron.validate = () => true;
  cron.schedule = () => ({
    start() {},
    stop() {
      stopCalls += 1;
    },
  });

  try {
    await service.scheduleJob('job-a', '* * * * * *');
    assert.equal(service.isScheduled('job-a'), true);

    const removed = await service.updateSchedule('job-a');
    assert.equal(removed, true);
    assert.equal(stopCalls, 1);
    assert.equal(service.isScheduled('job-a'), false);
  } finally {
    cron.validate = originalValidate;
    cron.schedule = originalSchedule;
  }
});

test('JobSchedulerService scheduled task triggers runtime startJob with metadata', async () => {
  const runtime = {
    ensureTopicInfrastructure: createAsyncSpy(),
    startJob: createAsyncSpy(),
  };
  const service = new JobSchedulerService(createJobModel(), runtime);

  const originalValidate = cron.validate;
  const originalSchedule = cron.schedule;
  let scheduledHandler;

  cron.validate = () => true;
  cron.schedule = (_expression, handler) => ({
    start() {
      scheduledHandler = handler;
    },
    stop() {},
  });

  try {
    const success = await service.scheduleJob('job-a', '* * * * * *');
    assert.equal(success, true);
    await scheduledHandler();
    assert.equal(runtime.startJob.calledTimes(), 1);
    assert.equal(runtime.startJob.calls[0][0], 'job-a');
    assert.deepEqual(runtime.startJob.calls[0][1], {});
    assert.equal(runtime.startJob.calls[0][2].scheduled, true);
    assert.equal(typeof runtime.startJob.calls[0][2].timestamp, 'number');
  } finally {
    cron.validate = originalValidate;
    cron.schedule = originalSchedule;
  }
});
