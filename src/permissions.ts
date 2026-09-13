import { MiniAppError, withHostCallback } from './async.js';
import type { Host } from './types.js';
import { supports } from './host.js';

/** True confirms delivery to the bot; the contact itself never enters the page. */
export function requestContact(host: Host, options: { signal?: AbortSignal; timeoutMs?: number } = {}): Promise<boolean> {
  if (!host.sdk.requestContact || !supports(host, 'requestContact')) {
    return Promise.reject(new MiniAppError('unsupported'));
  }
  return withHostCallback<boolean>(finish => {
    host.sdk.requestContact!(sent => finish(null, sent === true));
  }, { timeoutMs: 60000, ...options });
}

/** Requests native consent. False is a user denial; never grants permission locally. */
export function requestWriteAccess(host: Host, options: { signal?: AbortSignal; timeoutMs?: number } = {}): Promise<boolean> {
  if (!host.sdk.requestWriteAccess || (host.provider === 'lo' && !host.sdk.capabilities?.includes('requestWriteAccess'))) {
    return Promise.reject(new MiniAppError('unsupported'));
  }
  return withHostCallback<boolean>(finish => {
    host.sdk.requestWriteAccess!(allowed => finish(null, allowed === true));
  }, { timeoutMs: 60000, ...options });
}
