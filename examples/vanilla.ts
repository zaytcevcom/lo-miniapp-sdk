import {
  loadHost,
  supports,
  bindAppearance,
  withHostCallback,
} from "@lo/miniapp-sdk";
const host = await loadHost({ telegramFallback: false });
if (host) {
  const cleanup = bindAppearance(host, { themeEvent: "myapp:theme" });
  if (supports(host, "fullscreen")) host.sdk.requestFullscreen?.();
  window.addEventListener("pagehide", cleanup, { once: true });
  // Pass signed initData to your own backend for verification, never trust a parsed user ID.
}
// Wrap a native callback with a deadline instead of leaving the page busy forever.
export const waitForNative = <T>(
  start: (done: (error: unknown, result?: T) => void) => void,
) => withHostCallback<T>(start, { timeoutMs: 6000 });
