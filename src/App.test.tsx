import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import { createStorageClient } from './server/storageClient';
import { GEMINI_INTEGRATION_STORAGE_KEY } from './server/geminiIntegration';

describe('App', () => {
  it('shows a visible Gemini API Integration entry point in the main experience', () => {
    const html = renderToString(<App />);

    expect(html).toContain('Gemini API Integration');
    expect(html).toContain('Ask Gemini');
  });

  it('shows the persisted Gemini result after refresh', () => {
    const storage = new Map<string, string>();
    const storageClient = createStorageClient({
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    });

    storageClient.set(GEMINI_INTEGRATION_STORAGE_KEY, {
      status: 'complete',
      validationMessage: null,
      lastPrompt: 'Summarize the account',
      lastResponse: 'Persisted Gemini answer',
      updatedAt: 1712345678000,
    });

    const html = renderToString(<App storage={storageClient} />);

    expect(html).toContain('Summarize the account');
    expect(html).toContain('Persisted Gemini answer');
  });
});
