import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shareMessage } from '../dist/index.js';
const host = sdk => ({ provider: 'lo', sdk: { initData: '', capabilities: ['shareMessage'], ...sdk } });
test('shares only the opaque ID with a capable host and awaits native confirmation', async () => {
 let done; let sent;
 const pending = shareMessage(host({ shareMessage: (id, cb) => { sent = id; done = cb; } }), 'prepared');
 assert.equal(sent, 'prepared'); done(true); done(false); assert.equal(await pending, true);
 assert.equal(await shareMessage(host({ shareMessage: (_, cb) => cb(false) }), 'prepared'), false);
});
test('requires explicit LO capability or Telegram 8.0; invalid IDs never reach host', async () => {
 let calls = 0;
 const sdk = { version: '7.10', initData: '', shareMessage: (_, cb) => { calls++; cb(true); } };
 await assert.rejects(shareMessage({ provider: 'lo', sdk }, 'prepared'), { code: 'unsupported' });
 await assert.rejects(shareMessage({ provider: 'telegram', sdk }, 'prepared'), { code: 'unsupported' });
 for (const id of ['', 42, 'x'.repeat(129)]) await assert.rejects(shareMessage(host(sdk), id), TypeError);
 assert.equal(calls, 0); sdk.version = '8.0';
 assert.equal(await shareMessage({ provider: 'telegram', sdk }, 'prepared'), true);
});
test('timeout or abort settles once without automatically retrying a share', async () => {
 let late;
 await assert.rejects(shareMessage(host({ shareMessage: (_, cb) => { late = cb; } }), 'prepared', { timeoutMs: 5 }), { code: 'timeout' });
 late(true);
 const controller = new AbortController(); controller.abort(); let calls = 0;
 await assert.rejects(shareMessage(host({ shareMessage: () => { calls++; } }), 'prepared', { signal: controller.signal }), { code: 'cancelled' });
 assert.equal(calls, 0);
});
