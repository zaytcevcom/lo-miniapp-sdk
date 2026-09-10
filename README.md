# LO Mini App SDK

Typed, framework-independent browser SDK for LO Mini Apps and Telegram-compatible
hosts. No runtime dependencies. ESM, CommonJS and TypeScript declarations are
included. Importing the SDK is safe during server rendering and does not load a
remote script.

## Quick start

```ts
import { loadHost, bindAppearance, supports, subscribe } from "@lo/miniapp-sdk";

const host = await loadHost();
if (!host) {
  // Show your app's "Open in LO" screen. Browser mode does not forge identity.
} else {
  const stopAppearance = bindAppearance(host);
  const stopBack = subscribe(host, "backButtonClicked", () => history.back());
  if (supports(host, "fullscreen")) host.sdk.requestFullscreen?.();
  // On teardown: stopAppearance(); stopBack();
}
```

`loadHost` prefers `window.LO.WebApp`, preserving LO identity even when the host
also exposes the Telegram alias. With no injected host it can load the official
Telegram SDK once; disable that with `telegramFallback: false`. Loads are
coalesced, time-bounded and cleaned up. Browser mode returns `null`; it never
creates authenticated development users.

## Distribution during review

This repository is initially private, matching the example app repositories.
Consumers use an `npm pack` artifact in `vendor/`, pinned by the npm/Yarn lockfile
integrity. This avoids sharing personal credentials with builds in other repos.
The artifact contains built SDK code and declarations, not dependencies or host
implementation. Regenerate it from the reviewed SDK source; never patch it in a
consumer. The consuming PR records the SDK commit and SHA-256 in `vendor/README.md`.

```sh
npm ci
npm test
npm pack
# In a consuming app:
npm install ./vendor/lo-miniapp-sdk-0.1.0.tgz
```

Before general third-party distribution, the owner must choose public repository
visibility and package registry access, and supply an appropriate license. No npm
publication or open-source license grant is implied by this initial private repo.

## Public API

- `detectHost`, `loadHost`: host discovery, with SSR support and a bounded loader.
- `Host`, `HostSDK`, `HostButton`: typed native bridge facade. Optional methods
  describe possible platform surfaces; method existence is **not** proof of support.
- `supports`: LO's explicit capability list, Telegram's version gates. Older LO
  hosts without a capability list return false. This is progressive enhancement.
- `nativeVersion`: conservative Telegram version comparison for platform-only APIs.
- `subscribe`: event subscription with idempotent cleanup.
- `bindAppearance`: theme preference, host safe insets, optional chrome colors,
  media-query and bridge subscriptions with cleanup. Apps provide their theme
  event and colors; branding stays in the app.
- `withHostCallback`: a promise with timeout and AbortSignal handling for native
  callbacks that may never arrive. Late callbacks cannot alter the result.
- `authenticate`: app-specific server authentication through injected functions;
  optional launch-bound session cache. Cached tokens are revalidated. A transient
  backend failure propagates instead of causing a second login.
- `@lo/miniapp-sdk/protocol`: event names, payload types, byte limits and capability
  vocabulary shared by LO's host runtime. No React Native or Core dependency.

## Security boundary

`initData` and detected provider are client input. The app backend **must** verify
signature, launch age and audience before creating a session. This SDK does not
verify signatures in the browser or contain bot secrets. LO account bearer tokens
never cross into the Mini App; optional cache holds only the app's own session.
Avoid logging launch data and tokens. SDK error messages do not include them.

UI events do not authorize backend mutations. Native LO validates incoming bridge
messages before effects; app backends authorize app actions independently.

## Development and compatibility

Node 22+, `npm ci`, `npm test`. The tests cover both module formats, capability
checks, loader races, event teardown, late callbacks and session isolation.
Cactusmania and Wishlist are integration consumers; game logic, wishlists,
payments and app API clients stay in those repositories.

SDK package version, wire protocol version and Telegram compatibility version are
separate. Additive methods require contract tests and host support; unsupported
methods must not be advertised. Current SDK is 0.1.0 and subject to review before
its first public release.
