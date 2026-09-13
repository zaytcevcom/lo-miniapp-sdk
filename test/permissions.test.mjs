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

test('contact requires an advertised LO host or Telegram 6.9 and never passes contact data', async () => {
  const { requestContact, supports } = await import('../dist/index.js');
  let calls = 0;
  const sdk = { version: '6.9', initData: '', requestContact: cb => { calls++; cb(true); } };
  await assert.rejects(requestContact({ provider: 'lo', sdk }), { code: 'unsupported' });
  assert.equal(calls, 0);
  sdk.capabilities = ['requestContact'];
  assert.equal(await requestContact({ provider: 'lo', sdk }), true);
  assert.equal(supports({ provider: 'telegram', sdk }, 'requestContact'), true);
  assert.equal(await requestContact({ provider: 'telegram', sdk }), true);
  sdk.version = '6.8';
  await assert.rejects(requestContact({ provider: 'telegram', sdk }), { code: 'unsupported' });
  assert.equal(calls, 2);
});

test('contact preserves cancellation, settles once and bounds silent or aborted hosts', async () => {
  const { requestContact } = await import('../dist/index.js');
  const host = sdk => ({ provider: 'lo', sdk: { initData: '', capabilities: ['requestContact'], ...sdk } });
  assert.equal(await requestContact(host({ requestContact: cb => { cb(false); cb(true); } })), false);
  assert.equal(await requestContact(host({ requestContact: cb => cb('sent') })), false);
  await assert.rejects(requestContact(host({ requestContact() {} }), { timeoutMs: 5 }), { code: 'timeout' });
  const controller = new AbortController();
  controller.abort();
  let calls = 0;
  await assert.rejects(requestContact(host({ requestContact() { calls++; } }), { signal: controller.signal }), { code: 'cancelled' });
  assert.equal(calls, 0);
});
