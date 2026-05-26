import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('shows a clear chat entry point in the main authenticated experience', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('Authenticated workspace');
    expect(markup).toContain('Clear Chat');
  });

  it('renders inline guidance for valid clear chat input', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('Type CLEAR to clear all stored messages.');
  });
});
