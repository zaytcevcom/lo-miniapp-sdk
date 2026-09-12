import test from 'node:test';
import assert from 'node:assert/strict';
import { cloudStorage, supports } from '../dist/index.js';

function fixture(provider = 'lo') {
 const values = Object.create(null);
 const storage = {
  setItem(key, value, cb) { values[key] = value; cb(null, true); return this; },
  getItem(key, cb) { cb(null, values[key] ?? ''); return this; },
  getItems(keys, cb) { const result = Object.create(null); for (const key of keys) result[key] = values[key] ?? ''; cb(null, result); return this; },
  removeItem(key, cb) { delete values[key]; cb(null, true); return this; },
  removeItems(keys, cb) { for (const key of keys) delete values[key]; cb(null, true); return this; },
  getKeys(cb) { cb(null, Object.keys(values)); return this; },
 };
 return { provider, sdk: { initData: 'signed', version: '6.9', capabilities: ['cloudStorage'], CloudStorage: storage } };
}

test('CloudStorage uses explicit LO capability and Telegram 6.9 gate', async () => {
 const host = fixture(); host.sdk.capabilities = [];
 assert.equal(supports(host, 'cloudStorage'), false);
 await assert.rejects(cloudStorage(host).getKeys(), { code: 'unsupported' });
 const telegram = fixture('telegram');
 assert.equal(supports(telegram, 'cloudStorage'), true);
 telegram.sdk.version = '6.8';
 await assert.rejects(cloudStorage(telegram).getKeys(), { code: 'unsupported' });
});

test('all six storage methods preserve empty values, Unicode and special map keys', async () => {
 const storage = cloudStorage(fixture());
 assert.equal(await storage.setItem('__proto__', '🦆\0я'), true);
 assert.equal(await storage.getItem('__proto__'), '🦆\0я');
 const values = await storage.getItems(['__proto__', 'missing']);
 assert.equal(values.__proto__, '🦆\0я'); assert.equal(values.missing, '');
 assert.deepEqual(await storage.getKeys(), ['__proto__']);
 assert.equal(await storage.removeItem('__proto__'), true);
 assert.equal(await storage.setItem('empty', ''), true);
 assert.equal(await storage.removeItems(['empty', 'missing']), true);
 assert.deepEqual(await storage.getKeys(), []);
});

test('host failures stay failures and timeout/abort ignore late callbacks', async () => {
 const host = fixture(); let callback;
 host.sdk.CloudStorage.getItem = (_key, cb) => { callback = cb; return host.sdk.CloudStorage; };
 const storage = cloudStorage(host);
 const failed = storage.getItem('cart'); callback('QUOTA_EXCEEDED');
 await assert.rejects(failed, err => err === 'QUOTA_EXCEEDED');
 const controller = new AbortController();
 const cancelled = storage.getItem('cart', { signal: controller.signal });
 controller.abort(); callback(null, 'late');
 await assert.rejects(cancelled, { code: 'cancelled' });
 const timed = storage.getItem('cart', { timeoutMs: 1 });
 await assert.rejects(timed, { code: 'timeout' }); callback(null, 'late');
});
