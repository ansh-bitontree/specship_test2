// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeEach } from 'vitest';
import { App } from './App';

describe('App error handling workflow', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('blocks empty retry details and persists a completed retry after refresh', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);

    expect(screen.getByRole('button', { name: /open error handling/i })).toBeVisible();

    await user.click(screen.getByRole('button', { name: /open error handling/i }));
    await user.click(screen.getByRole('button', { name: /save retry plan/i }));

    expect(screen.getByText(/describe what failed before saving a retry plan/i)).toBeVisible();

    await user.type(
      screen.getByLabelText(/what failed/i),
      'API rate limit returned 429 while sending a message',
    );
    await user.selectOptions(screen.getByLabelText(/failure type/i), 'rate-limit');
    await user.click(screen.getByRole('button', { name: /save retry plan/i }));

    const savedPlan = screen.getByLabelText(/saved retry plan/i);
    expect(within(savedPlan).getByText(/retry plan saved/i)).toBeVisible();
    expect(
      within(savedPlan).getByText(/API rate limit returned 429 while sending a message/i),
    ).toBeVisible();
    expect(within(savedPlan).getByText(/^rate limit$/i)).toBeVisible();

    unmount();
    render(<App />);

    const restoredPlan = screen.getByLabelText(/saved retry plan/i);
    expect(
      within(restoredPlan).getByText(/API rate limit returned 429 while sending a message/i),
    ).toBeVisible();
    expect(within(restoredPlan).getByText(/retry plan saved/i)).toBeVisible();
  });
});
