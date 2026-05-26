import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App } from './App';

function renderApp(status?: 'empty' | 'loading' | 'error') {
  return renderToStaticMarkup(<App conversationStatus={status} />);
}

describe('App', () => {
  it('renders the primary workflow with accessible control names', () => {
    const markup = renderApp();

    expect(markup).toContain('<main');
    expect(markup).toContain('aria-labelledby="workspace-title"');
    expect(markup).toContain('<label for="message-composer"');
    expect(markup).toContain('id="message-composer"');
    expect(markup).toContain('name="message"');
    expect(markup).toContain('<button type="submit"');
    expect(markup).toContain('Start conversation');
  });

  it('explains the empty state and gives the next action', () => {
    const markup = renderApp('empty');

    expect(markup).toContain('No conversations yet');
    expect(markup).toContain('Draft a prompt below to start a new conversation.');
    expect(markup).toContain('Start conversation');
  });

  it('explains loading and error states with accessible announcements and recovery actions', () => {
    const loadingMarkup = renderApp('loading');
    const errorMarkup = renderApp('error');

    expect(loadingMarkup).toContain('role="status"');
    expect(loadingMarkup).toContain('Loading saved conversations');
    expect(loadingMarkup).toContain('disabled=""');

    expect(errorMarkup).toContain('role="alert"');
    expect(errorMarkup).toContain('Conversations could not load');
    expect(errorMarkup).toContain('Retry loading');
  });

  it('defines responsive layout guards and visible focus states', () => {
    const css = readFileSync(resolve(__dirname, 'App.css'), 'utf8');

    expect(css).toContain('box-sizing: border-box');
    expect(css).toContain('min-width: 0');
    expect(css).toContain('overflow-wrap: anywhere');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('@media (max-width: 700px)');
  });
});
