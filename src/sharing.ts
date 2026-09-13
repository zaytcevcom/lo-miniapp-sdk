import { MiniAppError, withHostCallback } from './async.js';
import { supports } from './host.js';
import type { Host } from './types.js';

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
