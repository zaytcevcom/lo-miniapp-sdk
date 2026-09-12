import type { Host, HostWindow } from "./types.js";
import type { Capability } from "./protocol.js";
const loads = new WeakMap<HostWindow, Promise<Host | null>>();
const browserWindow = (): HostWindow | undefined =>
  typeof window === "undefined" ? undefined : (window as HostWindow);

/** Host identity is a routing hint. Only the backend can validate initData. */
export function detectHost(win = browserWindow()): Host | null {
  if (win?.LO?.WebApp?.initData) return { provider: "lo", sdk: win.LO.WebApp };
  if (win?.Telegram?.WebApp?.initData)
    return { provider: "telegram", sdk: win.Telegram.WebApp };
  return null;
}
/** Idempotent loader; import is safe during SSR and does not fetch scripts. */
export function loadHost(
  options: {
    window?: HostWindow;
    timeoutMs?: number;
    telegramFallback?: boolean;
  } = {},
): Promise<Host | null> {
  const win = options.window ?? browserWindow();
  if (!win) return Promise.resolve(null);
  const detected = detectHost(win);
  if (detected) return Promise.resolve(detected);
  if (
    win.LO?.WebApp ||
    win.Telegram?.WebApp ||
    options.telegramFallback === false
  )
    return Promise.resolve(null);
  const existing = loads.get(win);
  if (existing) return existing;
  const timeoutMs = options.timeoutMs ?? 6000;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0)
    return Promise.reject(new RangeError("timeoutMs must be positive"));
  const loading = new Promise<Host | null>((resolve) => {
    const script = win.document.createElement("script");
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      script.onload = script.onerror = null;
      script.remove();
      resolve(detectHost(win));
    };
    const timer = setTimeout(finish, timeoutMs);
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;
    script.onload = script.onerror = finish;
    try {
      win.document.head.append(script);
    } catch {
      finish();
    }
  });
  loads.set(win, loading);
  void loading.finally(() => loads.delete(win));
  return loading;
}

export function nativeVersion(host: Host | null, minimum: string): boolean {
  const parse = (value: string): number[] | null =>
    /^\d+\.\d+(?:\.\d+)?$/.test(value) ? value.split(".").map(Number) : null;
  const actual = parse(host?.sdk.version ?? "");
  const expected = parse(minimum);
  if (!host || host.provider !== "telegram" || !actual || !expected)
    return false;
  for (let i = 0; i < 3; i++) {
    if ((actual[i] ?? 0) !== (expected[i] ?? 0))
      return (actual[i] ?? 0) > (expected[i] ?? 0);
  }
  return true;
}

export function supports(host: Host | null, capability: Capability): boolean {
  if (!host) return false;
  if (host.provider === "lo")
    return host.sdk.capabilities?.includes(capability) === true;
  const versions: Record<Capability, string> = {
    requestWriteAccess: "6.9",
    ready: "6.0",
    hideKeyboard: "9.1",
    cloudStorage: "6.9",
    expand: "6.0",
    backButton: "6.1",
    mainButton: "6.0",
    secondaryButton: "7.10",
    settingsButton: "7.0",
    closingConfirmation: "6.2",
    headerColor: "6.9",
    backgroundColor: "6.1",
    bottomBarColor: "7.10",
    fullscreen: "8.0",
    haptics: "6.1",
    popup: "6.2",
    openLink: "6.1",
    sendData: "6.0",
  };
  return nativeVersion(host, versions[capability]);
}

export function subscribe(
  host: Host | null,
  event: string,
  callback: () => void,
): () => void {
  const sdk = host?.sdk;
  if (!sdk?.onEvent || !sdk.offEvent) return () => {};
  sdk.onEvent(event, callback);
  let active = true;
  return () => {
    if (active) {
      active = false;
      sdk.offEvent?.(event, callback);
    }
  };
}
