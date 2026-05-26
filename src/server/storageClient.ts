export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface StorageClient {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}

export function createStorageClient(adapter: StorageAdapter): StorageClient {
  return {
    get<T>(key: string) {
      const value = adapter.getItem(key);
      return value === null ? null : (JSON.parse(value) as T);
    },
    set<T>(key: string, value: T) {
      adapter.setItem(key, JSON.stringify(value));
    },
    remove(key: string) {
      adapter.removeItem(key);
    },
  };
}

export const browserStorageClient =
  typeof window === 'undefined' || !window.localStorage
    ? null
    : createStorageClient(window.localStorage);
