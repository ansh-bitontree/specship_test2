import { describe, expect, it, vi } from 'vitest';
import { createStorageClient } from './storageClient';
import {
  GEMINI_INTEGRATION_STORAGE_KEY,
  loadGeminiIntegrationState,
  submitGeminiChat,
} from './geminiIntegration';

function createMemoryStorageClient() {
  const storage = new Map<string, string>();

  return createStorageClient({
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  });
}

describe('Gemini API integration workflow', () => {
  it('blocks empty input with a clear inline validation message', async () => {
    const fetchGemini = vi.fn();
    const storage = createMemoryStorageClient();

    const result = await submitGeminiChat({
      message: '   ',
      fetchGemini,
      storage,
      now: () => 1712345678000,
    });

    expect(result).toEqual({
      status: 'idle',
      validationMessage: 'Enter a message to send to Gemini.',
      lastPrompt: null,
      lastResponse: null,
      updatedAt: null,
    });
    expect(fetchGemini).not.toHaveBeenCalled();
  });

  it('submits valid input through the backend proxy and persists the result', async () => {
    const storage = createMemoryStorageClient();
    const fetchGemini = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: 'Gemini response' }),
    });

    const result = await submitGeminiChat({
      message: 'Explain the release plan',
      fetchGemini,
      storage,
      now: () => 1712345678000,
    });

    expect(fetchGemini).toHaveBeenCalledWith('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Explain the release plan' }),
    });
    expect(result).toEqual({
      status: 'complete',
      validationMessage: null,
      lastPrompt: 'Explain the release plan',
      lastResponse: 'Gemini response',
      updatedAt: 1712345678000,
    });
    expect(storage.get(GEMINI_INTEGRATION_STORAGE_KEY)).toEqual(result);
  });

  it('loads the persisted integration state after refresh', () => {
    const storage = createMemoryStorageClient();
    storage.set(GEMINI_INTEGRATION_STORAGE_KEY, {
      status: 'complete',
      validationMessage: null,
      lastPrompt: 'Summarize the account',
      lastResponse: 'Persisted Gemini answer',
      updatedAt: 1712345678000,
    });

    expect(loadGeminiIntegrationState(storage)).toEqual({
      status: 'complete',
      validationMessage: null,
      lastPrompt: 'Summarize the account',
      lastResponse: 'Persisted Gemini answer',
      updatedAt: 1712345678000,
    });
  });
});
