import { describe, expect, it } from 'vitest';
import type { Conversation } from '../domain/models';
import { createStorageClient } from './storageClient';
import {
  CHAT_CLEAR_CONFIRMATION,
  clearStoredConversation,
  getStoredConversation,
  saveStoredConversation,
} from './chatStorage';

function createMemoryStorage() {
  const storage = new Map<string, string>();

  return {
    adapter: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    },
    raw: storage,
  };
}

describe('chatStorage', () => {
  it('blocks empty clear chat confirmation with an inline message', () => {
    const { adapter } = createMemoryStorage();
    const client = createStorageClient(adapter);

    const result = clearStoredConversation(client, '   ');

    expect(result).toEqual({
      ok: false,
      message: `Type ${CHAT_CLEAR_CONFIRMATION} to clear the chat.`,
    });
  });

  it('blocks invalid clear chat confirmation with an inline message', () => {
    const { adapter } = createMemoryStorage();
    const client = createStorageClient(adapter);

    const result = clearStoredConversation(client, 'delete');

    expect(result).toEqual({
      ok: false,
      message: `Type ${CHAT_CLEAR_CONFIRMATION} exactly to clear the chat.`,
    });
  });

  it('clears stored messages when confirmation is valid and persists after reload', () => {
    const { adapter, raw } = createMemoryStorage();
    const client = createStorageClient(adapter);
    const existingConversation: Conversation = {
      createdAt: 1710000000000,
      messages: [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Keep this until clear is confirmed.',
          timestamp: 1710000000001,
        },
      ],
    };

    saveStoredConversation(client, existingConversation);

    const result = clearStoredConversation(client, CHAT_CLEAR_CONFIRMATION);

    expect(result).toEqual({
      ok: true,
      message: 'Chat cleared.',
    });
    expect(raw.has('conversation')).toBe(true);
    expect(getStoredConversation(client)).toEqual({
      createdAt: expect.any(Number),
      messages: [],
    });
  });
});
