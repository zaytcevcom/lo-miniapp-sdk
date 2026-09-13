export type Provider = "telegram" | "lo";
export type HostButton = {
  show?(): void;
  hide?(): void;
  onClick?(fn: () => void): void;
  offClick?(fn: () => void): void;
  setParams?(params: {
    text: string;
    is_active: boolean;
    is_visible: boolean;
  }): void;
};
export type StorageCallback<T> = (error: unknown, value?: T) => void;
export interface HostCloudStorage {
  setItem(key: string, value: string, callback?: StorageCallback<boolean>): HostCloudStorage;
  getItem(key: string, callback?: StorageCallback<string>): HostCloudStorage;
  getItems(keys: string[], callback?: StorageCallback<Record<string, string>>): HostCloudStorage;
  removeItem(key: string, callback?: StorageCallback<boolean>): HostCloudStorage;
  removeItems(keys: string[], callback?: StorageCallback<boolean>): HostCloudStorage;
  getKeys(callback?: StorageCallback<string[]>): HostCloudStorage;
}
export interface HostDeviceStorage {
  setItem(key: string, value: string, callback?: StorageCallback<boolean>): HostDeviceStorage;
  getItem(key: string, callback: StorageCallback<string | null>): HostDeviceStorage;
  removeItem(key: string, callback?: StorageCallback<boolean>): HostDeviceStorage;
  clear(callback?: StorageCallback<boolean>): HostDeviceStorage;
}
export interface HostSecureStorage {
  setItem(key: string, value: string, callback?: StorageCallback<boolean>): HostSecureStorage;
  getItem(key: string, callback: (error: unknown, value?: string | null, canRestore?: boolean) => void): HostSecureStorage;
  restoreItem(key: string, callback?: StorageCallback<string>): HostSecureStorage;
  removeItem(key: string, callback?: StorageCallback<boolean>): HostSecureStorage;
  clear(callback?: StorageCallback<boolean>): HostSecureStorage;
}
export interface HostLocationData {
  latitude: number;
  longitude: number;
  altitude: number | null;
  course: number | null;
  speed: number | null;
  horizontal_accuracy: number | null;
  vertical_accuracy: number | null;
  course_accuracy: number | null;
  speed_accuracy: number | null;
}
export interface HostLocationManager {
  readonly isInited: boolean;
  readonly isLocationAvailable: boolean;
  readonly isAccessRequested: boolean;
  readonly isAccessGranted: boolean;
  init(callback?: () => void): HostLocationManager;
  getLocation(callback: (location: HostLocationData | null) => void): HostLocationManager;
  openSettings(): HostLocationManager;
}
/** Acceleration (m/s²) or angular velocity (rad/s), depending on the manager. */
export interface HostMotionSensor {
  readonly isStarted: boolean;
  readonly x: number | null;
  readonly y: number | null;
  readonly z: number | null;
  start(params: { refresh_rate?: number }, callback?: (started: boolean) => void): HostMotionSensor;
  stop(callback?: (stopped: boolean) => void): HostMotionSensor;
}
export interface HostDeviceOrientation {
  readonly isStarted: boolean;
  readonly absolute: boolean;
  readonly alpha: number | null;
  readonly beta: number | null;
  readonly gamma: number | null;
  start(params: { refresh_rate?: number; need_absolute?: boolean }, callback?: (started: boolean) => void): HostDeviceOrientation;
  stop(callback?: (stopped: boolean) => void): HostDeviceOrientation;
}
export interface HostBiometricManager {
  readonly isInited: boolean;
  readonly isBiometricAvailable: boolean;
  readonly biometricType: "finger" | "face" | "unknown";
  readonly isAccessRequested: boolean;
  readonly isAccessGranted: boolean;
  readonly isBiometricTokenSaved: boolean;
  readonly deviceId: string;
  init(callback?: () => void): HostBiometricManager;
  requestAccess(params: { reason?: string }, callback?: (granted: boolean) => void): HostBiometricManager;
  authenticate(params: { reason?: string }, callback?: (authenticated: boolean, token?: string) => void): HostBiometricManager;
  updateBiometricToken(token: string, callback?: (updated: boolean) => void): HostBiometricManager;
  openSettings(): HostBiometricManager;
}
export interface HostSDK {
  BiometricManager?: HostBiometricManager;
  Accelerometer?: HostMotionSensor;
  Gyroscope?: HostMotionSensor;
  DeviceOrientation?: HostDeviceOrientation;
  LocationManager?: HostLocationManager;
  SecureStorage?: HostSecureStorage;
  DeviceStorage?: HostDeviceStorage;
  CloudStorage?: HostCloudStorage;
  initData: string;
  capabilities?: readonly string[];
  isFullscreen?: boolean;
  exitFullscreen?(): void;
  openInvoice?(url: string, callback: (status: string) => void): void;
  version?: string;
  colorScheme?: string;
  themeParams?: Record<string, string>;
  viewportStableHeight?: number;
  safeAreaInset?: { top: number; bottom: number };
  contentSafeAreaInset?: { top: number; bottom: number };
  ready?(): void;
  hideKeyboard?(): void;
  isOrientationLocked?: boolean;
  lockOrientation?(): void;
  unlockOrientation?(): void;
  /** null denotes denied or unavailable access; an empty string is valid clipboard text. */
  readTextFromClipboard?(callback?: (text: string | null) => void): HostSDK;
  /** Empty chat types return to the chat from which the Mini App was opened. */
  switchInlineQuery?(query: string, chooseChatTypes?: readonly ("users" | "bots" | "groups" | "channels")[]): void;
  /** Return true from the callback to close the continuous scanner. */
  showScanQrPopup?(params: { text?: string }, callback?: (text: string) => boolean | void): void;
  closeScanQrPopup?(): void;
  setHeaderColor?(color: string): void;
  setBackgroundColor?(color: string): void;
  setBottomBarColor?(color: string): void;
  expand?(): void;
  requestFullscreen?(): void;
  onEvent?(name: string, fn: () => void): void;
  offEvent?(name: string, fn: () => void): void;
  BackButton?: HostButton;
  MainButton?: HostButton;
  SecondaryButton?: HostButton;
  SettingsButton?: HostButton;
  enableClosingConfirmation?(): void;
  disableClosingConfirmation?(): void;
  requestWriteAccess?(callback: (allowed: boolean) => void): void;
  HapticFeedback?: {
    notificationOccurred?(type: string): void;
    impactOccurred?(type: string): void;
  };
}

export type Host = { provider: Provider; sdk: HostSDK };
export type HostWindow = Pick<Window, "document"> & {
  LO?: { WebApp?: HostSDK };
  Telegram?: { WebApp?: HostSDK };
};

declare global {
  interface Window {
    Telegram?: { WebApp?: HostSDK };
    LO?: { WebApp?: HostSDK };
  }
}
