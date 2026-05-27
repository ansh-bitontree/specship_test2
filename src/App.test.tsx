import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

describe('App loading state indicator', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('shows a visible entry point in the authenticated experience', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /ai response loading indicator/i })).toBeVisible();
    expect(screen.getByLabelText(/prompt/i)).toBeVisible();
    expect(screen.getByRole('button', { name: /send prompt/i })).toBeVisible();
  });

  it('blocks empty input with a clear inline message', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /send prompt/i }));

    expect(screen.getByText(/enter a prompt before sending/i)).toBeVisible();
  });

  it('shows loading feedback, completes with valid input, and persists the result after refresh', async () => {
    const { unmount } = render(<App />);

    fireEvent.change(screen.getByLabelText(/prompt/i), {
      target: { value: 'Summarize release notes' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send prompt/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/generating response/i);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });

    expect(screen.getByRole('heading', { name: /ai response ready/i })).toBeVisible();
    expect(screen.getByText(/summarize release notes/i)).toBeVisible();

    unmount();
    render(<App />);

    expect(screen.getByRole('heading', { name: /ai response ready/i })).toBeVisible();
    expect(screen.getByText(/summarize release notes/i)).toBeVisible();
  });
});
