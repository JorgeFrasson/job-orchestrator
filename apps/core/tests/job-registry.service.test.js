const test = require('node:test');
const assert = require('node:assert/strict');

const { JobRegistryService } = require('../build/src/jobs/job-registry.service.js');

test('JobRegistryService stores and lists remembered jobs', () => {
  const registry = new JobRegistryService();

  registry.remember({ topic: 'invoice.generate', service: 'billing' });
  registry.rememberMany([
    { topic: 'payment.capture', service: 'payments' },
    { topic: 'shipment.create', service: 'shipping' },
  ]);

  assert.equal(registry.has('invoice.generate'), true);
  assert.equal(registry.has('missing.topic'), false);
  assert.deepEqual(registry.list(), [
    { topic: 'invoice.generate', service: 'billing' },
    { topic: 'payment.capture', service: 'payments' },
    { topic: 'shipment.create', service: 'shipping' },
  ]);
});
