import { createRoot, type Root } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function renderApp() {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);

  flushSync(() => {
    root!.render(<App />);
  });

  return host;
}

function click(element: Element) {
  flushSync(() => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

function typeInto(element: HTMLTextAreaElement, value: string) {
  flushSync(() => {
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function submit(form: HTMLFormElement) {
  flushSync(() => {
    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
  });
}

describe('App chat interface', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-26T14:30:00.000Z'));
    localStorage.clear();
  });

  afterEach(() => {
    if (root) {
      flushSync(() => root!.unmount());
    }
    host?.remove();
    root = null;
    host = null;
    vi.useRealTimers();
    localStorage.clear();
  });

  it('shows a visible chat entry point in the authenticated experience', () => {
    const screen = renderApp();

    const entryPoint = screen.querySelector<HTMLButtonElement>('[data-testid="chat-entry"]');

    expect(entryPoint).not.toBeNull();
    expect(entryPoint?.textContent).toContain('Open chat');
  });

  it('lets users send a valid message and see user and AI responses with timestamps', () => {
    const screen = renderApp();
    click(screen.querySelector('[data-testid="chat-entry"]')!);

    const input = screen.querySelector<HTMLTextAreaElement>('[name="message"]')!;
    typeInto(input, 'Draft the project kickoff note');
    submit(screen.querySelector('form')!);

    expect(screen.textContent).toContain('You');
    expect(screen.textContent).toContain('Draft the project kickoff note');
    expect(screen.textContent).toContain('AI');
    expect(screen.textContent).toContain('I received: Draft the project kickoff note');
    expect(screen.textContent).toContain('2:30 PM');
  });

  it('blocks empty input with a clear inline validation message', () => {
    const screen = renderApp();
    click(screen.querySelector('[data-testid="chat-entry"]')!);

    typeInto(screen.querySelector<HTMLTextAreaElement>('[name="message"]')!, '   ');
    submit(screen.querySelector('form')!);

    expect(screen.textContent).toContain('Enter a message before sending.');
    expect(screen.textContent).not.toContain('I received:');
  });

  it('persists the conversation and shows it after refresh', () => {
    let screen = renderApp();
    click(screen.querySelector('[data-testid="chat-entry"]')!);
    typeInto(screen.querySelector<HTMLTextAreaElement>('[name="message"]')!, 'Persist this message');
    submit(screen.querySelector('form')!);

    flushSync(() => root!.unmount());
    host?.remove();
    root = null;
    host = null;

    screen = renderApp();
    click(screen.querySelector('[data-testid="chat-entry"]')!);

    expect(screen.textContent).toContain('Persist this message');
    expect(screen.textContent).toContain('I received: Persist this message');
  });
});
