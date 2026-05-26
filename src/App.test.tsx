import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';

describe('App chat interface', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows a visible chat entry point in the main authenticated experience', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /specship test2/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open chat/i })).toBeVisible();
  });

  it('blocks empty messages with a clear inline validation message', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /open chat/i }));
    await user.click(screen.getByRole('button', { name: /send message/i }));

    expect(screen.getByText(/enter a message before sending/i)).toBeVisible();
  });

  it('sends valid messages, distinguishes senders, timestamps messages, and persists after refresh', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);

    await user.click(screen.getByRole('button', { name: /open chat/i }));
    await user.type(screen.getByLabelText(/message/i), 'Draft the launch checklist');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    expect(screen.getByText('Draft the launch checklist')).toBeVisible();
    expect(screen.getByText(/user/i)).toBeVisible();
    expect(screen.getByText(/ai/i)).toBeVisible();
    expect(screen.getAllByText(/\d{1,2}:\d{2}/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/received: draft the launch checklist/i)).toBeVisible();

    unmount();
    render(<App />);

    expect(screen.getByText('Draft the launch checklist')).toBeVisible();
    expect(screen.getByText(/received: draft the launch checklist/i)).toBeVisible();
  });
});
