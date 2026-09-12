import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";
import {
  detectHost,
  loadHost,
  supports,
  nativeVersion,
  subscribe,
  authenticate,
  withHostCallback,
} from "../dist/index.js";
import { LO_HOST_CAPABILITIES } from "../dist/protocol.js";
const host = {
  provider: "lo",
  sdk: { initData: "signed", capabilities: LO_HOST_CAPABILITIES },
};

test("ESM and CommonJS entrypoints work without browser globals", async () => {
  assert.equal(detectHost(), null);
  assert.equal(await loadHost(), null);
  assert.equal(
    createRequire(import.meta.url)("../dist-cjs/index.js").detectHost(),
    null,
  );
});
test("LO alias takes precedence over Telegram compatibility alias", () => {
  assert.equal(
    detectHost({ LO: { WebApp: host.sdk }, Telegram: { WebApp: host.sdk } })
      .provider,
    "lo",
  );
});
test("capabilities are explicit; existence of an unsupported stub is not support", () => {
  assert.equal(
    supports(
      { provider: "lo", sdk: { initData: "x", requestFullscreen() {} } },
      "fullscreen",
    ),
    false,
  );
  assert.equal(supports(host, "fullscreen"), true);
  assert.equal(supports(null, "fullscreen"), false);
});
test("version comparison is numeric and conservative", () => {
  assert.equal(
    nativeVersion(
      { provider: "telegram", sdk: { initData: "x", version: "10.0" } },
      "9.6",
    ),
    true,
  );
  assert.equal(
    nativeVersion(
      { provider: "telegram", sdk: { initData: "x", version: "broken" } },
      "6.0",
    ),
    false,
  );
  assert.equal(nativeVersion(host, "6.0"), false);
});
test("native controls use explicit LO capabilities and Telegram version gates", () => {
  for (const [capability, before, since] of [
    ["settingsButton", "6.9", "7.0"],
    ["secondaryButton", "7.9", "7.10"],
    ["bottomBarColor", "7.9", "7.10"],
    ["hideKeyboard", "9.0", "9.1"],
  ]) {
    assert.equal(supports({ provider: "lo", sdk: { initData: "x", capabilities: [] } }, capability), false);
    assert.equal(supports(host, capability), true);
    assert.equal(supports({ provider: "telegram", sdk: { initData: "x", version: before } }, capability), false);
    assert.equal(supports({ provider: "telegram", sdk: { initData: "x", version: since } }, capability), true);
  }
});
test("subscriptions have idempotent cleanup", () => {
  const calls = [];
  const callback = () => {};
  const unsubscribe = subscribe(
    {
      ...host,
      sdk: {
        ...host.sdk,
        onEvent: (...args) => calls.push(args),
        offEvent: (...args) => calls.push(args),
      },
    },
    "themeChanged",
    callback,
  );
  unsubscribe();
  unsubscribe();
  assert.equal(calls.length, 2);
  assert.equal(calls[0][1], callback);
});
test("loader coalesces concurrent callers and cleans up its script", async () => {
  const scripts = [];
  let removed = 0;
  const win = {
    document: {
      createElement: () => ({ remove: () => removed++ }),
      head: { append: (script) => scripts.push(script) },
    },
  };
  const a = loadHost({ window: win, timeoutMs: 100 });
  const b = loadHost({ window: win, timeoutMs: 100 });
  assert.equal(a, b);
  assert.equal(scripts.length, 1);
  win.LO = { WebApp: host.sdk };
  scripts[0].onload();
  assert.equal((await a).provider, "lo");
  assert.equal(removed, 1);
});
test("loader timeout returns null and permits retry", async () => {
  let appended = 0;
  const win = {
    document: {
      createElement: () => ({ remove() {} }),
      head: { append: () => appended++ },
    },
  };
  assert.equal(await loadHost({ window: win, timeoutMs: 2 }), null);
  assert.equal(await loadHost({ window: win, timeoutMs: 2 }), null);
  assert.equal(appended, 2);
});
test("callback timeout and cancellation settle even when host never replies", async () => {
  await assert.rejects(
    withHostCallback(() => {}, { timeoutMs: 2 }),
    { code: "timeout" },
  );
  const controller = new AbortController();
  controller.abort();
  let started = false;
  await assert.rejects(
    withHostCallback(
      () => {
        started = true;
      },
      { signal: controller.signal },
    ),
    { code: "cancelled" },
  );
  assert.equal(started, false);
});
test("late and duplicate callbacks cannot replace first outcome", async () => {
  assert.equal(
    await withHostCallback((finish) => {
      finish(null, 1);
      finish(new Error("late"));
    }),
    1,
  );
});
function memoryStorage() {
  const entries = new Map();
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
  };
}
test("cached sessions are launch-bound and revalidated against the app backend", async () => {
  let auth = 0,
    checks = 0;
  const options = {
    storageKey: "app",
    storage: memoryStorage(),
    authenticate: async () => {
      auth++;
      return { token: "token", startParam: "start" };
    },
    validate: async () => {
      checks++;
    },
    isUnauthorized: () => false,
  };
  await authenticate(host, options);
  await authenticate(host, options);
  assert.equal(auth, 1);
  assert.equal(checks, 1);
  await authenticate(
    { ...host, sdk: { ...host.sdk, initData: "another launch" } },
    options,
  );
  assert.equal(auth, 2);
});
test("network failures do not become a second login; unauthorized sessions do", async () => {
  let auth = 0;
  const error = new Error("offline");
  const options = {
    storageKey: "app",
    storage: memoryStorage(),
    authenticate: async () => {
      auth++;
      return { token: "token", startParam: "" };
    },
    validate: async () => {},
    isUnauthorized: () => false,
  };
  await authenticate(host, options);
  await assert.rejects(
    authenticate(host, {
      ...options,
      validate: async () => {
        throw error;
      },
    }),
    error,
  );
  assert.equal(auth, 1);
  await authenticate(host, {
    ...options,
    validate: async () => {
      throw error;
    },
    isUnauthorized: () => true,
  });
  assert.equal(auth, 2);
});
test("malformed or inaccessible cache does not block login", async () => {
  const options = {
    storageKey: "app",
    storage: {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
    },
    authenticate: async () => ({ token: "t", startParam: "" }),
    validate: async () => {},
    isUnauthorized: () => false,
  };
  assert.equal((await authenticate(host, options)).token, "t");
});
