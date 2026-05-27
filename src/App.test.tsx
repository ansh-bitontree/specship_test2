import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

const conversationKey = 'scichat:conversation';

describe('SciChat app', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ content: 'Gemini response' }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the chat workspace', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /scichat/i })).toBeVisible();
    expect(screen.getByRole('textbox', { name: /message/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /send/i })).toBeVisible();
  });

  it('blocks empty prompts before calling the API', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    render(<App />);

    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(screen.getByText(/enter a message before sending/i)).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends prompts to Gemini and stores user and assistant messages', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    render(<App />);

    await user.type(screen.getByRole('textbox', { name: /message/i }), 'Explain CRISPR');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(fetchMock).toHaveBeenCalledWith('/api/gemini/chat', {
      body: JSON.stringify({ message: 'Explain CRISPR' }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    expect(await screen.findByText('Gemini response')).toBeVisible();

    const log = screen.getByRole('log', { name: /conversation/i });
    expect(within(log).getByText('Explain CRISPR')).toBeVisible();
    expect(within(log).getByText('Gemini response')).toBeVisible();

    const stored = JSON.parse(localStorage.getItem(conversationKey) ?? '{}');
    expect(stored.messages).toMatchObject([
      { role: 'user', content: 'Explain CRISPR' },
      { role: 'assistant', content: 'Gemini response' },
    ]);
  });

  it('restores persisted conversation history on reload', () => {
    localStorage.setItem(
      conversationKey,
      JSON.stringify({
        messages: [
          {
            id: 'message-1',
            role: 'user',
            content: 'What is mRNA?',
            timestamp: 1_711_111_111_000,
          },
          {
            id: 'message-2',
            role: 'assistant',
            content: 'mRNA carries genetic instructions.',
            timestamp: 1_711_111_112_000,
          },
        ],
      }),
    );

    render(<App />);

    expect(screen.getByText('What is mRNA?')).toBeVisible();
    expect(screen.getByText('mRNA carries genetic instructions.')).toBeVisible();
  });

  it('shows a sanitized frontend error when Gemini fails', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ detail: 'Gemini request failed.' }),
      }),
    );
    render(<App />);

    await user.type(screen.getByRole('textbox', { name: /message/i }), 'Trigger failure');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/gemini request failed/i)).toBeVisible();
    });
  });
});
