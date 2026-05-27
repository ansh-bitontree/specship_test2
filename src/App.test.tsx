import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

const conversationKey = 'scichat:conversation';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders the SciChat workspace and empty conversation', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /scichat/i })).toBeVisible();
    expect(screen.getByText(/no messages yet/i)).toBeVisible();
    expect(screen.getByRole('textbox', { name: /message/i })).toBeVisible();
  });

  it('blocks empty prompts before calling Gemini', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(screen.getByText(/enter a message before sending/i)).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends a prompt to the Gemini proxy and stores both messages', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: 'A concise Gemini answer.' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    await user.type(screen.getByRole('textbox', { name: /message/i }), 'Explain CRISPR');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(fetchMock).toHaveBeenCalledWith('/api/gemini/chat', {
      body: JSON.stringify({ message: 'Explain CRISPR' }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    expect(await screen.findByText('A concise Gemini answer.')).toBeVisible();
    expect(screen.getByText('Explain CRISPR')).toBeVisible();

    const stored = JSON.parse(localStorage.getItem(conversationKey) ?? '{}');
    expect(stored.messages).toMatchObject([
      { role: 'user', content: 'Explain CRISPR' },
      { role: 'gemini', content: 'A concise Gemini answer.' },
    ]);
  });

  it('hydrates saved user and Gemini messages from localStorage', () => {
    localStorage.setItem(
      conversationKey,
      JSON.stringify({
        createdAt: 1_711_111_111_000,
        messages: [
          {
            id: 'message-1',
            role: 'user',
            content: 'Saved user prompt',
            timestamp: 1_711_111_111_001,
          },
          {
            id: 'message-2',
            role: 'gemini',
            content: 'Saved Gemini answer',
            timestamp: 1_711_111_111_002,
          },
        ],
      }),
    );

    render(<App />);

    const log = screen.getByRole('log', { name: /conversation/i });
    expect(within(log).getByText('Saved user prompt')).toBeVisible();
    expect(within(log).getByText('Saved Gemini answer')).toBeVisible();
  });

  it('shows sanitized API errors without storing failed Gemini messages', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ detail: 'Gemini request failed. Try again.' }),
      }),
    );

    render(<App />);

    await user.type(screen.getByRole('textbox', { name: /message/i }), 'Trigger failure');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(await screen.findByText('Gemini request failed. Try again.')).toBeVisible();
    await waitFor(() => {
      expect(localStorage.getItem(conversationKey)).toBeNull();
    });
  });
});
