import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shareToStory, supports } from '../dist/index.js';
const host = sdk => ({ provider: 'lo', sdk: { initData: '', capabilities: ['shareToStory'], ...sdk } });

test('opens the editor with cloned media/caption/link parameters without claiming publication', () => {
  let received;
  const params = { text: 'My story', widget_link: { url: 'http://example.com/page', name: 'Visit', user_id: 42 }, audience: 'everyone' };
  const result = shareToStory(host({ shareToStory: (...args) => { received = args; return true; } }), 'https://cdn.example/media?signature=a%2Bb', params);
  assert.equal(result, undefined);
  assert.deepEqual(received, ['https://cdn.example/media?signature=a%2Bb', { text: 'My story', widget_link: { url: 'http://example.com/page', name: 'Visit' } }]);
  params.widget_link.name = 'Changed';
  assert.equal(received[1].widget_link.name, 'Visit');
});

test('requires advertised LO support or Telegram 7.8', () => {
  let calls = 0;
  const sdk = { initData: '', version: '7.7', shareToStory: () => calls++ };
  assert.throws(() => shareToStory({ provider: 'lo', sdk }, 'https://cdn.example/media'), { code: 'unsupported' });
  assert.throws(() => shareToStory({ provider: 'telegram', sdk }, 'https://cdn.example/media'), { code: 'unsupported' });
  sdk.version = '7.8';
  assert.equal(supports({ provider: 'telegram', sdk }, 'shareToStory'), true);
  shareToStory({ provider: 'telegram', sdk }, 'https://cdn.example/media');
  assert.equal(calls, 1);
});

test('invalid media, labels and captions never reach the native host', () => {
  let calls = 0;
  const app = host({ shareToStory: () => calls++ });
  for (const url of ['http://cdn.example/a', 'file:///secret', 'https://user:password@cdn.example/a', 'https://cdn.example/with space', 'https://cdn.example/\\evil', 42]) {
    assert.throws(() => shareToStory(app, url), TypeError);
  }
  for (const params of [null, [], { text: 'x'.repeat(2049) }, { widget_link: { url: 'javascript:alert(1)' } }, { widget_link: { url: 'https://example.com', name: 'x'.repeat(49) } }]) {
    assert.throws(() => shareToStory(app, 'https://cdn.example/a', params), TypeError);
  }
  assert.equal(calls, 0);
});
