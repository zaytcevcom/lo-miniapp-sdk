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
export interface HostSDK {
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
