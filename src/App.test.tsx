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
  });
});
