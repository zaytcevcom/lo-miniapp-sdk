import test from 'node:test';
import assert from 'node:assert/strict';
import { deviceStorage, supports } from '../dist/index.js';

test('DeviceStorage capability/version gates and missing values preserve the host contract', async () => {
  const values = new Map();
  const host = { provider: 'lo', sdk: { initData: '', capabilities: ['deviceStorage'], DeviceStorage: {
    setItem(key, value, done) { values.set(key, value); done(null, true); return this; },
    getItem(key, done) { done(null, values.get(key) ?? null); return this; },
    removeItem(key, done) { values.delete(key); done(null, true); return this; },
    clear(done) { values.clear(); done(null, true); return this; },
  } } };
  const storage = deviceStorage(host);
  assert.equal(await storage.getItem('missing'), null);
  assert.equal(await storage.setItem('__proto__', '🦆'), true);
  assert.equal(await storage.getItem('__proto__'), '🦆');
  assert.equal(await storage.removeItem('__proto__'), true);
  await storage.setItem('empty', '');
  assert.equal(await storage.getItem('empty'), '');
  assert.equal(await storage.clear(), true);
  host.sdk.capabilities = [];
  await assert.rejects(storage.getItem('key'), { code: 'unsupported' });
  host.provider = 'telegram'; host.sdk.version = '8.0';
  assert.equal(supports(host, 'deviceStorage'), false);
  host.sdk.version = '9.0';
  assert.equal(await storage.getItem('key'), null);
  host.sdk.DeviceStorage.getItem = (_key, done) => { done('STORAGE_UNAVAILABLE'); };
  await assert.rejects(storage.getItem('key'), error => error === 'STORAGE_UNAVAILABLE');
});
