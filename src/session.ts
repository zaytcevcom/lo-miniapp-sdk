import type { Host } from "./types.js";
export interface AppSession {
  token: string;
  startParam: string;
}
/** App API adapter stays with the app. Storage contents are hints, always revalidated. */
export async function authenticate<T extends AppSession>(
  host: Host,
  options: {
    storageKey: string;
    authenticate: (launch: {
      provider: Host["provider"];
      initData: string;
    }) => Promise<T>;
    validate: (token: string) => Promise<unknown>;
    isUnauthorized: (error: unknown) => boolean;
    storage?: Storage | null;
  },
): Promise<AppSession> {
  let fingerprint = "";
  if (globalThis.crypto?.subtle) {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(host.sdk.initData),
    );
    fingerprint = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
  }
  let storage: Storage | null = null;
  try {
    storage =
      options.storage === undefined
        ? globalThis.sessionStorage
        : options.storage;
  } catch {
    /* In-memory session works in restricted WebViews. */
  }
  let cached: unknown;
  try {
    cached = JSON.parse(storage?.getItem(options.storageKey) ?? "null");
  } catch {
    /* Cache is optional and untrusted. */
  }
  if (fingerprint && cached && typeof cached === "object") {
    const value = cached as Record<string, unknown>;
    if (
      value.fingerprint === fingerprint &&
      value.provider === host.provider &&
      typeof value.token === "string" &&
      value.token &&
      typeof value.startParam === "string"
    ) {
      try {
        await options.validate(value.token);
        return { token: value.token, startParam: value.startParam };
      } catch (error) {
        if (!options.isUnauthorized(error)) throw error;
      }
    }
  }
  const session = await options.authenticate({
    provider: host.provider,
    initData: host.sdk.initData,
  });
  if (
    !session.token ||
    typeof session.token !== "string" ||
    typeof session.startParam !== "string"
  )
    throw new TypeError("Invalid application session");
  if (fingerprint)
    try {
      storage?.setItem(
        options.storageKey,
        JSON.stringify({
          provider: host.provider,
          fingerprint,
          token: session.token,
          startParam: session.startParam,
        }),
      );
    } catch {
      /* Session remains usable in memory. */
    }
  return { token: session.token, startParam: session.startParam };
}
