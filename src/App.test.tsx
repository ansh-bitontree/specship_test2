import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('shows the message history persistence entry point in the authenticated experience', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('Message History');
    expect(markup).toContain('Save message');
    expect(markup).toContain('name="message"');
  });
});
