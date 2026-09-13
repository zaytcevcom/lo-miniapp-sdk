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
npm install ./vendor/lo-miniapp-sdk-0.6.0.tgz
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
methods must not be advertised. Current SDK is 0.6.0 and subject to review before
its first public release.

### Bot message permission

`requestWriteAccess(host, { signal?, timeoutMs? })` requests native confirmation
and resolves to `true` only when the host confirms access. A user cancellation
resolves to `false`; unsupported hosts, aborts and timeouts reject with
`MiniAppError`. The default timeout is 60 seconds. Check
`supports(host, "requestWriteAccess")` before offering the action.

Installing or opening a Mini App does not grant this permission. The LO host
binds requests to the launch bot, stores consent on the server and lets users
revoke it through the Mini App menu. Apps without a bot cannot receive messages.

### Native controls

Use `supports(host, "secondaryButton")`, `supports(host, "settingsButton")` and
`supports(host, "bottomBarColor")` before offering these features. LO hosts
advertise each capability explicitly; the package version does not enable it on
older clients. Telegram hosts require versions 7.10, 7.0 and 7.10 respectively.
The secondary button supports left, right, top and bottom placement relative to
the main button. Subscribe to each button's click event and clean up on teardown.

`supports(host, "hideKeyboard")` detects native keyboard dismissal (Telegram
9.1+ or an explicit LO host capability). Call `host.sdk.hideKeyboard?.()` to
dismiss the current on-screen keyboard; it is harmless when no keyboard is open.

### Persistent CloudStorage

`cloudStorage(host)` provides promise-based `setItem`, `getItem`, `getItems`,
`removeItem`, `removeItems`, and `getKeys`. Calls require Telegram 6.9+ or an
explicit LO `cloudStorage` capability. An unsupported host rejects the promise;
an outage never becomes an empty value. The native host owns authentication,
user/application isolation and persistent storage. This package cannot enable
storage on an older client.

```ts
import { cloudStorage, supports } from '@lo/miniapp-sdk';

if (supports(host, 'cloudStorage')) {
  const storage = cloudStorage(host);
  await storage.setItem('draft', 'Hello');
  const draft = await storage.getItem('draft', { signal });
}
```

Each operation accepts an optional AbortSignal and positive timeoutMs (30 seconds
by default). Cancellation stops waiting for the result; it does not undo a write
already accepted by the host. Direct `host.sdk.CloudStorage` retains Telegram's
six chainable callback methods. LO host support and server rollout ship separately.

### QR scanner

`supports(host, "qrScanner")` checks explicit LO support or Telegram 6.4+.
`host.sdk.showScanQrPopup({ text? }, callback?)` opens a continuous native scanner;
return `true` from the callback or call `closeScanQrPopup()` to close it. The
optional prompt is limited to 64 UTF-16 units after trimming. Native hosts emit
`qr_text_received` for scans and `scan_qr_popup_closed` for user dismissal or
permission failure, but not for a programmatic close. Telegram exposes the
public `scanQrPopupClosed` event from 7.7. These additive types do not enable a
scanner on an older LO binary; native implementation and permission handling
must be distributed separately before advertising the capability.

### Device storage

`deviceStorage(host)` provides Promise-based `setItem`, `getItem`, `removeItem`
and `clear` operations. LO requires the explicit `deviceStorage` capability;
Telegram requires version 9.0 or later. Missing keys return `null`, while a
stored empty string remains an empty string. Operations accept the same abort
signal and timeout options as CloudStorage. Native quota, disk and session
errors are propagated to the caller. This is local device storage; use
CloudStorage when data must follow the account across devices.

### Secure storage

`secureStorage(host)` exposes native encrypted set/get/remove/clear and
`restoreItem`. `getItem` returns `{ value, canRestore }`, preserving the native
restoration flag. LO requires `secureStorage`; Telegram requires version 9.0.
Restoration requires native user consent. Errors, denied consent and cancellation
are propagated, and operations default to a 60-second timeout. No secrets are
stored by this SDK itself.

### Switch to an inline query

`host.sdk.switchInlineQuery(query, chooseChatTypes)` prepares an inline query
in a native chat composer. Check `supports(host, "switchInlineQuery")` first
(LO capability, Telegram 6.7+). Queries are limited to 256 UTF-16 code units.
Without chat types, LO returns to the native source chat when available;
standalone launches offer the chat picker. Explicit types select among
`users`, `bots`, `groups`, and `channels`; LO currently has no channel
conversation kind, so channels-only requests show no eligible destinations.
The host resolves the launch bot identity, refreshes destination permissions
and remote draft, and preserves occupied drafts and recordings. Selection
only prepares text; the user still chooses an inline result and sends it.
Cancellation keeps the Mini App open.

### Read clipboard text

Check `supports(host, "clipboard")` before calling
`host.sdk.readTextFromClipboard(callback)`. Telegram requires 6.4+. LO checks
the authenticated installed-app library and a native user interaction within
the preceding 10 seconds. Page messages cannot grant that interaction.
The callback receives a string (including an empty string) or `null` when
access is refused, unavailable, cancelled or times out. LO accepts up to 1 MiB
of UTF-8 text and leaves clipboard contents unchanged. Backgrounding, page
navigation and account changes cancel pending access. The native operating
system may ask for clipboard access; the SDK cannot bypass that permission.

Orientation capability exposes `lockOrientation()` and `unlockOrientation()` plus `isOrientationLocked`. LO requires a native host supporting the orientation contract; closing or backgrounding the Mini App restores the underlying application orientation.

### LocationManager

Capability `location` exposes Telegram 8.0-compatible `sdk.LocationManager`.
Call `init(callback)` before `getLocation(callback)` or `openSettings()`.
Initialization only checks availability and bot permission; it never asks for a
position. A location callback receives coordinates and nullable accuracy/motion
fields, or `null` on denial or unavailability. Access is scoped to the logged-in
account and bot. `openSettings()` requires a recent interaction with the Mini App.
LO requests one current position at a time and cancels delivery when the host
closes, backgrounds, or changes accounts. It does not store location history.

### BiometricManager

Capability `biometry` exposes Telegram 7.2-compatible `sdk.BiometricManager`.
Initialize with `init()`, then request bot access with `requestAccess({reason})`.
Consent does not authenticate or read a token. `updateBiometricToken(token)` saves
a token of up to 1024 characters; an empty token removes it. `authenticate({reason},
callback)` returns the system-authenticated token. `openSettings()` requires a
recent Mini App interaction. LO scopes permission, token keys and device IDs to
the account, bot and local installation. Native hosts must enforce biometric
protection for token reads and writes before advertising this capability.


Native `Accelerometer`, `Gyroscope` and `DeviceOrientation` managers expose readonly samples and chainable start/stop callbacks. Check the `sensors` capability before use. Refresh intervals are 20–1000 milliseconds (default 1000); native hardware may deliver a different frequency. Acceleration includes gravity in m/s², gyroscope samples are rad/s, and orientation angles are radians. `need_absolute` requests a north reference; inspect `absolute` because relative fallback is allowed.
