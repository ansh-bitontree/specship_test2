import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

const CONVERSATION_STORAGE_KEY = 'scichat:conversation';

describe('SciChat app', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders the chat workspace', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /scichat/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeEnabled();
  });

  it('validates empty prompts without calling the API', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(screen.getByText(/enter a message before sending/i)).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends a message to Gemini and persists the conversation', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: 'Gemini response' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { unmount } = render(<App />);

    await user.type(screen.getByLabelText(/message/i), 'Explain CRISPR');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(fetchMock).toHaveBeenCalledWith('/api/gemini/chat', {
      body: JSON.stringify({ message: 'Explain CRISPR' }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    expect(await screen.findByText('Gemini response')).toBeVisible();
    expect(screen.getByText('Explain CRISPR')).toBeVisible();

    const stored = JSON.parse(localStorage.getItem(CONVERSATION_STORAGE_KEY) ?? '{}');
    expect(stored.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: 'user', content: 'Explain CRISPR' }),
        expect.objectContaining({ role: 'assistant', content: 'Gemini response' }),
      ]),
    );

    unmount();
    render(<App />);

    expect(screen.getByText('Explain CRISPR')).toBeVisible();
    expect(screen.getByText('Gemini response')).toBeVisible();
  });

  it('shows a sanitized message when the Gemini API fails', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ detail: 'Gemini request failed. Try again later.' }),
      }),
    );

    render(<App />);

    await user.type(screen.getByLabelText(/message/i), 'Cause an upstream failure');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/gemini request failed/i)).toBeVisible();
    });
  });
});
