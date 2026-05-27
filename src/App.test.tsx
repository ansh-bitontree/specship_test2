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
