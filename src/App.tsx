import { type FormEvent, useState } from 'react';
import './App.css';

interface GeminiIntegrationState {
  lastPrompt: string;
  lastResponse: string;
}

const geminiStorageKey = 'geminiIntegrationState';

function loadGeminiState(): GeminiIntegrationState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const value = window.localStorage.getItem(geminiStorageKey);
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as GeminiIntegrationState;
  } catch {
    window.localStorage.removeItem(geminiStorageKey);
    return null;
  }
}

export function App() {
  const [isGeminiOpen, setIsGeminiOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [geminiState, setGeminiState] = useState<GeminiIntegrationState | null>(() =>
    loadGeminiState(),
  );

  async function handleGeminiSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setError('Enter a message before sending.');
      return;
    }

    setError('');
    setIsSending(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        body: JSON.stringify({ message: trimmedMessage }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Gemini request failed.');
      }

      const data = (await response.json()) as { content?: string };
      const nextState = {
        lastPrompt: trimmedMessage,
        lastResponse: data.content ?? '',
      };
      window.localStorage.setItem(geminiStorageKey, JSON.stringify(nextState));
      setGeminiState(nextState);
      setMessage('');
    } catch {
      setError('Gemini could not respond. Try again.');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="workspace-panel">
        <div className="workspace-copy">
          <p className="eyebrow">Main authenticated experience</p>
          <h1>Authenticated workspace</h1>
          <p>Connect Gemini through the secure backend proxy without exposing API keys.</p>
        </div>

        <button
          className="primary-action"
          type="button"
          onClick={() => setIsGeminiOpen((isOpen) => !isOpen)}
        >
          Gemini API Integration
        </button>

        {isGeminiOpen ? (
          <form className="gemini-panel" onSubmit={handleGeminiSubmit}>
            <label htmlFor="gemini-message">Message for Gemini</label>
            <textarea
              id="gemini-message"
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                if (error) {
                  setError('');
                }
              }}
              rows={4}
            />
            {error ? <p className="inline-error">{error}</p> : null}
            <button className="primary-action" type="submit" disabled={isSending}>
              {isSending ? 'Sending...' : 'Send to Gemini'}
            </button>
          </form>
        ) : null}

        {geminiState ? (
          <section className="gemini-result" aria-label="Last Gemini response">
            <h2>Last Gemini response</h2>
            <p className="prompt-label">Prompt: {geminiState.lastPrompt}</p>
            <p>{geminiState.lastResponse}</p>
          </section>
        ) : null}
      </section>
    </main>
  );
}
