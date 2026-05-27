import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

const conversationStorageKey = 'scichat:conversation';

describe('SciChat frontend', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders the chat composer', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /scichat/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeEnabled();
  });

  it('shows validation and does not call the API for empty prompts', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);

    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(screen.getByText(/enter a message before sending/i)).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts messages to the Gemini proxy and persists user and Gemini replies', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: 'A Gemini response' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { unmount } = render(<App />);

    await user.type(screen.getByLabelText(/message/i), 'Explain photosynthesis');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(fetchMock).toHaveBeenCalledWith('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Explain photosynthesis' }),
    });
    expect(await screen.findByText('Explain photosynthesis')).toBeVisible();
    expect(screen.getByText('A Gemini response')).toBeVisible();

    const storedConversation = JSON.parse(
      localStorage.getItem(conversationStorageKey) ?? '{}',
    );
    expect(storedConversation.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: 'user', content: 'Explain photosynthesis' }),
        expect.objectContaining({ role: 'gemini', content: 'A Gemini response' }),
      ]),
    );

    unmount();
    render(<App />);

    expect(screen.getByText('Explain photosynthesis')).toBeVisible();
    expect(screen.getByText('A Gemini response')).toBeVisible();
  });

  it('shows sanitized API errors without persisting failed Gemini replies', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ detail: 'Gemini request failed. Try again later.' }),
      }),
    );
    render(<App />);

    await user.type(screen.getByLabelText(/message/i), 'Will this fail?');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(await screen.findByText(/gemini request failed/i)).toBeVisible();
    await waitFor(() => {
      expect(screen.queryByText('Will this fail?')).not.toBeInTheDocument();
    });
    expect(localStorage.getItem(conversationStorageKey)).toBeNull();
  });
});
