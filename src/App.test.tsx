import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';

describe('App chat interface', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows a visible chat entry point in the main authenticated experience', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /specship test2/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open chat/i })).toBeVisible();
  });

  it('blocks empty messages with a clear inline validation message', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /open chat/i }));
    await user.click(screen.getByRole('button', { name: /send message/i }));

    expect(screen.getByText(/enter a message before sending/i)).toBeVisible();
  });

  it('sends valid messages, distinguishes senders, timestamps messages, and persists after refresh', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);

    await user.click(screen.getByRole('button', { name: /open chat/i }));
    await user.type(screen.getByLabelText(/message/i), 'Draft the launch checklist');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    expect(screen.getByText('Draft the launch checklist')).toBeVisible();
    expect(screen.getByText(/user/i)).toBeVisible();
    expect(screen.getByText(/ai/i)).toBeVisible();
    expect(screen.getAllByText(/\d{1,2}:\d{2}/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/received: draft the launch checklist/i)).toBeVisible();
// @vitest-environment jsdom
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './App';

const CONVERSATION_STORAGE_KEY = 'specship:conversation';

const roots: Root[] = [];

function storedConversation() {
  return {
    createdAt: 1_711_111_111_000,
    messages: [
      {
        id: 'message-1',
        role: 'user',
        content: 'Hello from storage',
        timestamp: 1_711_111_111_001,
      },
    ],
  };
}

function getButton(container: HTMLElement, name: string) {
  const button = Array.from(container.querySelectorAll('button')).find(
    (element) => element.textContent?.trim() === name,
  );

  if (!button) {
    throw new Error(`Button not found: ${name}`);
  }

  return button as HTMLButtonElement;
}

function getConfirmationInput(container: HTMLElement) {
  const input = container.querySelector<HTMLInputElement>(
    'input[name="clearConfirmation"]',
  );

  if (!input) {
    throw new Error('Clear confirmation input not found');
  }

  return input;
}

async function renderApp() {
  const container = document.createElement('div');
  document.body.append(container);

  const root = createRoot(container);
  roots.push(root);

  flushSync(() => {
    root.render(<App />);
  });

  return container;
}

async function click(element: HTMLElement) {
  flushSync(() => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

async function typeInto(input: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value',
  )?.set;

  flushSync(() => {
    valueSetter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

afterEach(() => {
  for (const root of roots.splice(0)) {
    flushSync(() => {
      root.unmount();
    });
  }

  document.body.innerHTML = '';
  localStorage.clear();
});

describe('App clear chat action', () => {
  it('shows a clear chat entry point in the main experience', async () => {
    localStorage.setItem(
      CONVERSATION_STORAGE_KEY,
      JSON.stringify(storedConversation()),
    );

    const container = await renderApp();

    expect(getButton(container, 'Clear chat')).toBeTruthy();
    expect(container.textContent).toContain('Hello from storage');
  });

  it('blocks empty confirmation input with an inline message', async () => {
    localStorage.setItem(
      CONVERSATION_STORAGE_KEY,
      JSON.stringify(storedConversation()),
    );

    const container = await renderApp();

    await click(getButton(container, 'Clear chat'));
    await click(getButton(container, 'Clear conversation'));

    expect(container.textContent).toContain('Type CLEAR to clear the chat.');
    expect(localStorage.getItem(CONVERSATION_STORAGE_KEY)).not.toBeNull();
    expect(container.textContent).toContain('Hello from storage');
  });

  it('blocks invalid confirmation input with an inline message', async () => {
    localStorage.setItem(
      CONVERSATION_STORAGE_KEY,
      JSON.stringify(storedConversation()),
    );

    const container = await renderApp();

    await click(getButton(container, 'Clear chat'));
    await typeInto(getConfirmationInput(container), 'clear');
    await click(getButton(container, 'Clear conversation'));

    expect(container.textContent).toContain('Type CLEAR to clear the chat.');
    expect(localStorage.getItem(CONVERSATION_STORAGE_KEY)).not.toBeNull();
    expect(container.textContent).toContain('Hello from storage');
  });

  it('clears stored messages with valid confirmation and keeps the result after remount', async () => {
    localStorage.setItem(
      CONVERSATION_STORAGE_KEY,
      JSON.stringify(storedConversation()),
    );

    const container = await renderApp();

    await click(getButton(container, 'Clear chat'));
    await typeInto(getConfirmationInput(container), 'CLEAR');
    await click(getButton(container, 'Clear conversation'));

    expect(localStorage.getItem(CONVERSATION_STORAGE_KEY)).toBeNull();
    expect(container.textContent).not.toContain('Hello from storage');
    expect(container.textContent).toContain('No messages yet.');

    const refreshedContainer = await renderApp();

    expect(refreshedContainer.textContent).not.toContain('Hello from storage');
    expect(refreshedContainer.textContent).toContain('No messages yet.');

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
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';

describe('App message history persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows a message history entry point in the main experience', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /message history/i })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: /message/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /save message/i })).toBeTruthy();
  });

  it('blocks empty messages with a clear inline message', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /save message/i }));

    expect(screen.getByText('Enter a message before saving.')).toBeTruthy();
    expect(screen.queryByRole('listitem')).toBeNull();
  });

  it('saves valid messages and restores them after refresh', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);

    await user.type(screen.getByRole('textbox', { name: /message/i }), 'Continue this later');
    await user.click(screen.getByRole('button', { name: /save message/i }));

    const history = screen.getByRole('list', { name: /saved conversation/i });
    expect(within(history).getByText('Continue this later')).toBeTruthy();
    expect(screen.queryByText('Enter a message before saving.')).toBeNull();

    unmount();
    render(<App />);

    const restoredHistory = screen.getByRole('list', { name: /saved conversation/i });
    expect(within(restoredHistory).getByText('Continue this later')).toBeTruthy();
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

    expect(screen.getByText('Draft the launch checklist')).toBeVisible();
    expect(screen.getByText(/received: draft the launch checklist/i)).toBeVisible();
  });
});
