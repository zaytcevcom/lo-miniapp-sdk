import { MiniAppError, withHostCallback } from './async.js';
import { supports } from './host.js';
import type { Host, StoryShareParams } from './types.js';

/** Native preview, destination choice and confirmation. True requires actual delivery. */
export function shareMessage(
  host: Host,
  id: string,
  options: { signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<boolean> {
  if (!host.sdk.shareMessage || !supports(host, 'shareMessage')) {
    return Promise.reject(new MiniAppError('unsupported'));
  }
  if (typeof id !== 'string' || !id.length || id.length > 128) {
    return Promise.reject(new TypeError('Invalid prepared message ID'));
  }
  return withHostCallback<boolean>(finish => {
    host.sdk.shareMessage!(id, sent => finish(null, sent === true));
  }, { timeoutMs: 300000, ...options });
}


function storyUrl(value: unknown, media: boolean): asserts value is string {
  if (typeof value !== 'string' || value.length > 8192 ||
      !/^https?:\/\//i.test(value) || /[\s\\\u0000-\u001f\u007f]/.test(value)) {
    throw new TypeError('Invalid story URL');
  }
  const url = new URL(value);
  if (!url.hostname || url.username || url.password || (media && url.protocol !== 'https:')) {
    throw new TypeError('Invalid story URL');
  }
}

/** Requests a native editor. Returns no publication receipt or promise. */
export function shareToStory(host: Host, mediaUrl: string, params: StoryShareParams = {}): void {
  if (!host.sdk.shareToStory || !supports(host, 'shareToStory')) {
    throw new MiniAppError('unsupported');
  }
  storyUrl(mediaUrl, true);
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    throw new TypeError('Invalid story parameters');
  }
  const payload: StoryShareParams = {};
  if (params.text !== undefined) {
    if (typeof params.text !== 'string' || params.text.length > 2048) {
      throw new TypeError('Invalid story caption');
    }
    payload.text = params.text;
  }
  if (params.widget_link !== undefined) {
    const link = params.widget_link;
    if (!link || typeof link !== 'object' || Array.isArray(link)) {
      throw new TypeError('Invalid story link');
    }
    storyUrl(link.url, false);
    if (link.name !== undefined && (typeof link.name !== 'string' || link.name.length > 48)) {
      throw new TypeError('Invalid story link label');
    }
    payload.widget_link = { url: link.url, ...(link.name !== undefined ? { name: link.name } : {}) };
  }
  host.sdk.shareToStory(mediaUrl, payload);
}
