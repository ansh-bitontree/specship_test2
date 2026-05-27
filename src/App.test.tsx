// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

const savedIntegration = 'geminiIntegrationState';

describe('App Gemini integration workflow', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('shows an authenticated Gemini entry point, blocks empty input, submits valid prompts, and persists the result', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: 'Gemini says hello' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { unmount } = render(<App />);

    expect(screen.getByRole('heading', { name: /authenticated workspace/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /gemini api integration/i })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /gemini api integration/i }));
    await user.click(screen.getByRole('button', { name: /send to gemini/i }));

    expect(screen.getByText(/enter a message before sending/i)).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText(/message for gemini/i), 'Summarize the project status');
    await user.click(screen.getByRole('button', { name: /send to gemini/i }));

    expect(fetchMock).toHaveBeenCalledWith('/api/gemini/chat', {
      body: JSON.stringify({ message: 'Summarize the project status' }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    expect(await screen.findByText('Gemini says hello')).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(savedIntegration) ?? '{}')).toMatchObject({
      lastPrompt: 'Summarize the project status',
      lastResponse: 'Gemini says hello',
    });

    unmount();
    render(<App />);

    expect(screen.getByText(/last gemini response/i)).toBeTruthy();
    expect(screen.getByText('Gemini says hello')).toBeTruthy();
/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';

describe('App error handling workflow', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('lets users record an error handling plan and see it after refresh', async () => {
    const user = userEvent.setup();

    const { unmount } = render(<App />);

    await user.click(screen.getByRole('button', { name: /error handling/i }));
    await user.selectOptions(screen.getByLabelText(/failure type/i), 'rate-limit');
    await user.type(
      screen.getByLabelText(/what happened/i),
      '429 returned while syncing invoices',
    );
    await user.click(screen.getByRole('button', { name: /save retry plan/i }));

    expect(screen.getByRole('heading', { name: /rate limit/i })).toBeTruthy();
    expect(screen.getByText(/429 returned while syncing invoices/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /retry now/i })).toBeTruthy();

    unmount();
    render(<App />);

    expect(screen.getByText(/429 returned while syncing invoices/i)).toBeTruthy();
    expect(screen.getByText(/ready to retry/i)).toBeTruthy();
  });

  it('blocks empty error details with a clear inline message', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole('button', { name: /error handling/i }));
    await user.click(screen.getByRole('button', { name: /save retry plan/i }));

    expect(screen.getByText(/describe the error before saving a retry plan/i)).toBeTruthy();
    expect(window.localStorage.getItem('specship:error-handling-plan')).toBeNull();
  });
});
