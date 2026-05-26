import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('shows a visible Gemini API Integration entry point in the main experience', () => {
    const html = renderToString(<App />);

    expect(html).toContain('Gemini API Integration');
    expect(html).toContain('Ask Gemini');
  });
});
