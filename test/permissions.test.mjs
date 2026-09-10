import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requestWriteAccess } from '../dist/index.js';

test('requires native capability and preserves denial', async () => {
  let calls = 0;
  const sdk = { initData: '', requestWriteAccess: cb => { calls++; cb(false); } };
  await assert.rejects(requestWriteAccess({ provider: 'lo', sdk }), { code: 'unsupported' });
  assert.equal(calls, 0);
  sdk.capabilities = ['requestWriteAccess'];
  assert.equal(await requestWriteAccess({ provider: 'lo', sdk }), false);
  assert.equal(calls, 1);
});
test('accepts the native result and times out silent hosts', async () => {
  assert.equal(await requestWriteAccess({ provider: 'telegram', sdk: { initData: '', requestWriteAccess: cb => cb(true) } }), true);
  await assert.rejects(requestWriteAccess({ provider: 'telegram', sdk: { initData: '', requestWriteAccess: () => {} } }, { timeoutMs: 5 }), { code: 'timeout' });
});
