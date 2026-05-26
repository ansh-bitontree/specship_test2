import { describe, expect, it, vi } from 'vitest';
import {
  GEMINI_INTEGRATION_STORAGE_KEY,
  createEmptyGeminiIntegrationState,
  loadGeminiIntegrationState,
  submitGeminiPrompt,
} from './geminiIntegration';
import type { StorageClient } from '../server/storageClient';

function createMemoryStorage(initial?: unknown): StorageClient {
  const values = new Map<string, string>();

  if (initial !== undefined) {
    values.set(GEMINI_INTEGRATION_STORAGE_KEY, JSON.stringify(initial));
  }

  return {
    get<T>(key: string) {
      const value = values.get(key);
      return value === undefined ? null : (JSON.parse(value) as T);
    },
    set<T>(key: string, value: T) {
      values.set(key, JSON.stringify(value));
    },
    remove(key: string) {
      values.delete(key);
    },
  };
}

describe('Gemini API integration workflow', () => {
  it('loads an empty persisted state when no integration has been completed', () => {
    expect(loadGeminiIntegrationState(createMemoryStorage())).toEqual(
      createEmptyGeminiIntegrationState(),
    );
  });

  it('blocks empty prompts with an inline validation message and does not call the proxy', async () => {
    const fetchGemini = vi.fn();

    const result = await submitGeminiPrompt({
      prompt: '   ',
      storage: createMemoryStorage(),
      fetchGemini,
    });

    expect(result.error).toBe('Enter a message before sending it to Gemini.');
    expect(result.state.status).toBe('idle');
    expect(fetchGemini).not.toHaveBeenCalled();
  });

  it('submits valid input through the backend proxy and persists the result', async () => {
    const storage = createMemoryStorage();
    const fetchGemini = vi.fn(async (prompt: string) => ({
      reply: `Gemini reply for: ${prompt}`,
    }));

    const result = await submitGeminiPrompt({
      prompt: 'Summarize this launch plan',
      storage,
      fetchGemini,
    });

    expect(fetchGemini).toHaveBeenCalledWith('Summarize this launch plan');
    expect(result.error).toBeNull();
    expect(result.state).toMatchObject({
      prompt: 'Summarize this launch plan',
      response: 'Gemini reply for: Summarize this launch plan',
      status: 'complete',
    });
    expect(loadGeminiIntegrationState(storage)).toEqual(result.state);
  });
});
