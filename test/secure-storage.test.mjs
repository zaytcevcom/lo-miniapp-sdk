import test from 'node:test';
import assert from 'node:assert/strict';
import { secureStorage, supports } from '../dist/index.js';

test('SecureStorage exposes restoration availability without discarding it', async () => {
  let restoreAllowed = false;
  const host = { provider: 'lo', sdk: { initData: '', capabilities: ['secureStorage'], SecureStorage: {
    getItem(_key, cb) { cb(null, null, true); return this; },
    restoreItem(_key, cb) { cb(restoreAllowed ? null : 'USER_DECLINED', restoreAllowed ? 'secret' : undefined); return this; },
    setItem(_key, _value, cb) { cb(null, true); return this; },
    removeItem(_key, cb) { cb(null, true); return this; },
    clear(cb) { cb(null, true); return this; },
  } } };
  const storage = secureStorage(host);
  assert.deepEqual(await storage.getItem('key'), { value: null, canRestore: true });
  await assert.rejects(storage.restoreItem('key'), err => err === 'USER_DECLINED');
  restoreAllowed = true;
  assert.equal(await storage.restoreItem('key'), 'secret');
  assert.equal(await storage.setItem('key', ''), true);
  assert.equal(await storage.removeItem('key'), true);
  assert.equal(await storage.clear(), true);
  host.sdk.capabilities = [];
  await assert.rejects(storage.getItem('key'), { code: 'unsupported' });
  host.provider = 'telegram'; host.sdk.version = '8.0';
  assert.equal(supports(host, 'secureStorage'), false);
  host.sdk.version = '9.0';
  assert.equal(supports(host, 'secureStorage'), true);
});
