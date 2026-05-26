import { describe, expect, it } from 'vitest';
import { createStorageClient } from './storageClient';

describe('createStorageClient', () => {
  it('returns a reusable server-side client configured for localStorage', () => {
    const storage = new Map<string, string>();
    const client = createStorageClient({
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    });

    client.set('settings', { theme: 'light', preferences: { compact: true } });

    expect(client.get('settings')).toEqual({
      theme: 'light',
      preferences: { compact: true },
    });
  });
});
