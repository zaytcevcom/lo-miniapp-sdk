/** Events the Mini App sends to the client. */
export const MiniAppOutgoingEvent = {
  /** The app finished loading and is ready to be shown. */
  Ready: "web_app_ready",
  HideKeyboard: "web_app_hide_keyboard",
  RequestWriteAccess: "web_app_request_write_access",
  /** Expand the app to full height. */
  Expand: "web_app_expand",
  RequestFullscreen: "web_app_request_fullscreen",
  ExitFullscreen: "web_app_exit_fullscreen",
  /** Close the app; `return_back` asks for the back transition. */
  Close: "web_app_close",
  /** A button press to deliver to the bot — the SendData half of the session. */
  DataSend: "web_app_data_send",
  /** Main button appearance and state. */
  SetupMainButton: "web_app_setup_main_button",
  /** Secondary button appearance and state. */
  SetupSecondaryButton: "web_app_setup_secondary_button",
  /** Back button visibility. */
  SetupBackButton: "web_app_setup_back_button",
  /** Settings button visibility. */
  SetupSettingsButton: "web_app_setup_settings_button",
  /** Whether closing asks for confirmation first. */
  SetupClosingBehavior: "web_app_setup_closing_behavior",
  /** Whether a vertical swipe may close the app. */
  SetupSwipeBehavior: "web_app_setup_swipe_behavior",
  /** Header color, either a theme key or an explicit `#rrggbb`. */
  SetHeaderColor: "web_app_set_header_color",
  /** Background color behind the page. */
  SetBackgroundColor: "web_app_set_background_color",
  /** Bottom bar color. */
  SetBottomBarColor: "web_app_set_bottom_bar_color",
  /** Haptic feedback of the requested kind. */
  TriggerHapticFeedback: "web_app_trigger_haptic_feedback",
  /** Open an external link. */
  OpenLink: "web_app_open_link",
  /** Open an in-platform link (the LO equivalent of a t.me link). */
  OpenPlatformLink: "web_app_open_tg_link",
  /** Ask the client to draw a native popup. */
  OpenPopup: "web_app_open_popup",
  /** Ask for the current viewport metrics. */
  RequestViewport: "web_app_request_viewport",
  /** Ask for the current theme. */
  RequestTheme: "web_app_request_theme",
  /** Ask for the safe area of the screen. */
  RequestSafeArea: "web_app_request_safe_area",
  /** Ask for the safe area of the content, below the client's own header. */
  RequestContentSafeArea: "web_app_request_content_safe_area",
  /**
   * LO's own, not Telegram's: the shim failed to install, so the page has no
   * `window.Telegram` at all. It is the only signal that separates "this Mini
   * App is broken" from "our shim never ran", and a client that ignores it
   * shows a blank WebView with nothing in any log.
   */
  ShimFailed: "lo_web_app_shim_failed",
} as const;

export type MiniAppOutgoingEventName =
  (typeof MiniAppOutgoingEvent)[keyof typeof MiniAppOutgoingEvent];

/** Events the client sends to the Mini App. */
export const MiniAppIncomingEvent = {
  MainButtonPressed: "main_button_pressed",
  SecondaryButtonPressed: "secondary_button_pressed",
  BackButtonPressed: "back_button_pressed",
  SettingsButtonPressed: "settings_button_pressed",
  ViewportChanged: "viewport_changed",
  ThemeChanged: "theme_changed",
  SafeAreaChanged: "safe_area_changed",
  ContentSafeAreaChanged: "content_safe_area_changed",
  PopupClosed: "popup_closed",
  WriteAccessRequested: "write_access_requested",
  VisibilityChanged: "visibility_changed",
  FullscreenChanged: "fullscreen_changed",
  FullscreenFailed: "fullscreen_failed",
} as const;

export type MiniAppIncomingEventName =
  (typeof MiniAppIncomingEvent)[keyof typeof MiniAppIncomingEvent];

/** The envelope every `postMessage` from the shim carries. */
export type MiniAppBridgeMessage = {
  eventType: string;
  eventData?: unknown;
};

/** `web_app_data_send` — one press, on its way to the bot. */
export type DataSendPayload = { data: string };

/** `web_app_close` — `return_back` is a hint about the transition, not a route. */
export type ClosePayload = { return_back?: boolean };

/** `web_app_setup_main_button` / `..._secondary_button`. */
export type BottomButtonPayload = {
  is_visible?: boolean;
  is_active?: boolean;
  is_progress_visible?: boolean;
  text?: string;
  color?: string;
  text_color?: string;
  has_shine_effect?: boolean;
  position?: string;
};

/** `web_app_setup_back_button` / `..._settings_button`. */
export type VisibilityPayload = { is_visible?: boolean };

/** `web_app_setup_closing_behavior`. */
export type ClosingBehaviorPayload = { need_confirmation?: boolean };

/** `web_app_setup_swipe_behavior`. */
export type SwipeBehaviorPayload = { allow_vertical_swipe?: boolean };

/** `web_app_set_header_color` — exactly one of the two fields is set. */
export type HeaderColorPayload = { color_key?: string; color?: string };

/** `web_app_set_background_color` / `web_app_set_bottom_bar_color`. */
export type ColorPayload = { color: string };

/** `web_app_trigger_haptic_feedback`. */
export type HapticPayload = {
  type: "impact" | "notification" | "selection_change";
  impact_style?: "light" | "medium" | "heavy" | "rigid" | "soft";
  notification_type?: "error" | "success" | "warning";
};

/** `web_app_open_link`. */
export type OpenLinkPayload = {
  url: string;
  try_instant_view?: boolean;
  try_browser?: boolean;
};

/** `web_app_open_tg_link` — a platform path such as `/resolve?domain=…`. */
export type OpenPlatformLinkPayload = { path_full: string };

/** One button of a native popup. */
export type PopupButton = {
  id?: string;
  type?: "default" | "ok" | "close" | "cancel" | "destructive";
  text?: string;
};

/** `web_app_open_popup` — the shim has already validated these fields. */
export type OpenPopupPayload = {
  title?: string;
  message: string;
  buttons: PopupButton[];
};

/** `viewport_changed` — heights are CSS pixels of the WebView. */
export type ViewportChangedPayload = {
  height: number;
  is_state_stable: boolean;
  is_expanded: boolean;
};

/** `theme_changed`. */
export type ThemeChangedPayload = { theme_params: Record<string, string> };

/** `safe_area_changed` / `content_safe_area_changed`. */
export type InsetPayload = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

/** `popup_closed` — absent `button_id` means dismissed without a choice. */
export type PopupClosedPayload = { button_id?: string };

/** `visibility_changed` — the app moved between foreground and background. */
export type VisibilityChangedPayload = { is_visible: boolean };

/** Limits are byte-based; check envelopes before JSON parsing. */
export const MiniAppLimits = Object.freeze({
  envelopeBytes: 65536,
  sendDataBytes: 4096,
});

export const LO_SDK_PROTOCOL_VERSION = 1 as const;
/** Advertise only features implemented by the native host, never SDK method presence. */
export const LO_HOST_CAPABILITIES = [
  "requestWriteAccess",
  "ready",
  "hideKeyboard",
  "expand",
  "backButton",
  "mainButton",
  "secondaryButton",
  "settingsButton",
  "closingConfirmation",
  "headerColor",
  "backgroundColor",
  "bottomBarColor",
  "fullscreen",
  "haptics",
  "popup",
  "openLink",
  "sendData",
] as const;
export type Capability = (typeof LO_HOST_CAPABILITIES)[number];
