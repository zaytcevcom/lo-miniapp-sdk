import { MiniAppError, withHostCallback } from "./async.js";
import { supports } from "./host.js";
import type { Host, HostCloudStorage, HostDeviceStorage, StorageCallback } from "./types.js";

export type StorageOptions = { signal?: AbortSignal; timeoutMs?: number };

/** Promise facade over the host's persistent, user/application-scoped storage. */
export function cloudStorage(host: Host) {
  function call<T>(start: (storage: HostCloudStorage, done: StorageCallback<T>) => void, options: StorageOptions): Promise<T> {
    if (!supports(host, "cloudStorage") || !host.sdk.CloudStorage) {
      return Promise.reject(new MiniAppError("unsupported"));
    }
    const storage = host.sdk.CloudStorage;
    return withHostCallback<T>(finish => start(storage, finish), { timeoutMs: 30000, ...options });
  }
  return {
    setItem: (key: string, value: string, options: StorageOptions = {}) =>
      call<boolean>((storage, done) => storage.setItem(key, value, done), options),
    getItem: (key: string, options: StorageOptions = {}) =>
      call<string>((storage, done) => storage.getItem(key, done), options),
    getItems: (keys: string[], options: StorageOptions = {}) =>
      call<Record<string, string>>((storage, done) => storage.getItems(keys, done), options),
    removeItem: (key: string, options: StorageOptions = {}) =>
      call<boolean>((storage, done) => storage.removeItem(key, done), options),
    removeItems: (keys: string[], options: StorageOptions = {}) =>
      call<boolean>((storage, done) => storage.removeItems(keys, done), options),
    getKeys: (options: StorageOptions = {}) =>
      call<string[]>((storage, done) => storage.getKeys(done), options),
  };
}

/** Persistent storage on the current device, isolated by account and bot. */
export function deviceStorage(host: Host) {
  function call<T>(start: (storage: HostDeviceStorage, done: StorageCallback<T>) => void, options: StorageOptions): Promise<T> {
    if (!supports(host, "deviceStorage") || !host.sdk.DeviceStorage) {
      return Promise.reject(new MiniAppError("unsupported"));
    }
    return withHostCallback<T>(finish => start(host.sdk.DeviceStorage!, finish), { timeoutMs: 30000, ...options });
  }
  return {
    setItem: (key: string, value: string, options: StorageOptions = {}) =>
      call<boolean>((storage, done) => storage.setItem(key, value, done), options),
    getItem: (key: string, options: StorageOptions = {}) =>
      call<string | null>((storage, done) => storage.getItem(key, done), options),
    removeItem: (key: string, options: StorageOptions = {}) =>
      call<boolean>((storage, done) => storage.removeItem(key, done), options),
    clear: (options: StorageOptions = {}) =>
      call<boolean>((storage, done) => storage.clear(done), options),
  };
}
