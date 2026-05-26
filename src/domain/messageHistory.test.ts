import { describe, expect, it } from 'vitest';
import { createStorageClient } from '../server/storageClient';
import { loadConversation, submitMessage } from './messageHistory';

function createMemoryStorage() {
  const storage = new Map<string, string>();

  return {
    client: createStorageClient({
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    }),
    storage,
  };
}

describe('message history persistence', () => {
  it('blocks empty input with an inline validation message', () => {
    const { client, storage } = createMemoryStorage();

    const result = submitMessage(client, '   ');

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Enter a message before saving it.');
    expect(storage.size).toBe(0);
  });

  it('persists valid messages and restores them for the next page load', () => {
    const { client } = createMemoryStorage();

    const result = submitMessage(client, 'Continue the rollout plan');
    const restored = loadConversation(client);

    expect(result.ok).toBe(true);
    expect(restored.messages).toHaveLength(1);
    expect(restored.messages[0]).toMatchObject({
      role: 'user',
      content: 'Continue the rollout plan',
    });
  });
});
