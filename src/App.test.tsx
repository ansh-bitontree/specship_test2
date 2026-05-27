import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

const conversationStorageKey = 'scichat:conversation';

describe('SciChat app', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders the chat interface', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /scichat/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /message/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('validates empty prompts before calling Gemini', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(screen.getByText(/enter a message before sending/i)).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends a prompt to Gemini and renders the response', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: 'Here is a concise answer.' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    await user.type(screen.getByRole('textbox', { name: /message/i }), 'Explain quantum spin');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(fetchMock).toHaveBeenCalledWith('/api/gemini/chat', {
      body: JSON.stringify({ message: 'Explain quantum spin' }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    expect(await screen.findByText('Explain quantum spin')).toBeVisible();
    expect(await screen.findByText('Here is a concise answer.')).toBeVisible();
  });

  it('persists user and Gemini messages after remount', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ content: 'Stored Gemini answer.' }),
      }),
    );

    const { unmount } = render(<App />);

    await user.type(screen.getByRole('textbox', { name: /message/i }), 'Save this exchange');
    await user.click(screen.getByRole('button', { name: /send/i }));
    await screen.findByText('Stored Gemini answer.');

    const storedConversation = JSON.parse(localStorage.getItem(conversationStorageKey) ?? '{}');
    expect(storedConversation.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: 'user', content: 'Save this exchange' }),
        expect.objectContaining({ role: 'gemini', content: 'Stored Gemini answer.' }),
      ]),
    );

    unmount();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Save this exchange')).toBeVisible();
      expect(screen.getByText('Stored Gemini answer.')).toBeVisible();
    });
  });

  it('shows a friendly error when Gemini fails', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ detail: 'Gemini request failed. Try again later.' }),
      }),
    );

    render(<App />);

    await user.type(screen.getByRole('textbox', { name: /message/i }), 'Trigger an error');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(await screen.findByText(/gemini request failed/i)).toBeVisible();
  });
});
