const assert = require('node:assert/strict');

function createAsyncSpy(implementation = async () => undefined) {
  const calls = [];

  const spy = async (...args) => {
    calls.push(args);
    return implementation(...args);
  };

  spy.calls = calls;
  spy.calledTimes = () => calls.length;
  spy.lastCall = () => calls.at(-1);

  return spy;
}

function createSyncSpy(implementation = () => undefined) {
  const calls = [];

  const spy = (...args) => {
    calls.push(args);
    return implementation(...args);
  };

  spy.calls = calls;
  spy.calledTimes = () => calls.length;
  spy.lastCall = () => calls.at(-1);

  return spy;
}

function assertCalledOnceWith(spy, ...expectedArgs) {
  assert.equal(spy.calledTimes(), 1);
  assert.deepEqual(spy.lastCall(), expectedArgs);
}

module.exports = {
  createAsyncSpy,
  createSyncSpy,
  assertCalledOnceWith,
};
