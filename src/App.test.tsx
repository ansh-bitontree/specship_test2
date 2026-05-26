import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('shows a visible Gemini API Integration entry point in the authenticated experience', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('Authenticated Workspace');
    expect(markup).toContain('Gemini API Integration');
    expect(markup).toContain('/api/gemini/chat');
  });
});
