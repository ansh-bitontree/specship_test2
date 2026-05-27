import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import './App.css';

interface LoadingIndicatorResult {
  prompt: string;
  response: string;
  completedAt: number;
}

const resultStorageKey = 'loading-indicator-result';

function readStoredResult() {
  const storedResult = window.localStorage.getItem(resultStorageKey);
  return storedResult ? (JSON.parse(storedResult) as LoadingIndicatorResult) : null;
}

function writeStoredResult(result: LoadingIndicatorResult) {
  window.localStorage.setItem(resultStorageKey, JSON.stringify(result));
}

export function App() {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LoadingIndicatorResult | null>(null);

  useEffect(() => {
    setResult(readStoredResult());
  }, []);

  function submitPrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      setError('Enter a prompt before sending.');
      return;
    }

    setError('');
    setIsLoading(true);

    window.setTimeout(() => {
      const nextResult = {
        prompt: trimmedPrompt,
        response: `AI response ready for: ${trimmedPrompt}`,
        completedAt: Date.now(),
      };

      setResult(nextResult);
      writeStoredResult(nextResult);
      setIsLoading(false);
      setPrompt('');
    }, 650);
  }

  return (
    <main className="app-shell">
      <section className="loading-workflow" aria-labelledby="loading-workflow-title">
        <p className="eyebrow">Authenticated workspace</p>
        <h1 id="loading-workflow-title">AI Response Loading Indicator</h1>
        <p>
          Send a prompt and watch the processing state before the response is saved.
        </p>

        <form className="prompt-form" onSubmit={submitPrompt} noValidate>
          <label htmlFor="prompt">Prompt</label>
          <textarea
            id="prompt"
            name="prompt"
            onChange={(event) => {
              setPrompt(event.target.value);
              if (error) {
                setError('');
              }
            }}
            rows={4}
            value={prompt}
          />
          {error ? <p className="field-error">{error}</p> : null}

          <button disabled={isLoading} type="submit">
            {isLoading ? 'Sending...' : 'Send prompt'}
          </button>
        </form>

        {isLoading ? (
          <div className="loading-status" role="status" aria-live="polite">
            <span className="spinner" aria-hidden="true" />
            Generating response...
          </div>
        ) : null}

        {result ? (
          <section className="response-panel" aria-label="Saved AI response">
            <h2>AI response ready</h2>
            <p>{result.response}</p>
          </section>
        ) : null}
      </section>
    </main>
  );
}
