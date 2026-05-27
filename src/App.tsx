import { type FormEvent, useState } from 'react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import './App.css';
import { useState, type FormEvent } from 'react';

const ERROR_PLAN_STORAGE_KEY = 'specship:error-handling-plan';

type FailureType = 'api-failure' | 'network-issue' | 'rate-limit';

interface ErrorHandlingPlan {
  failureType: FailureType;
  details: string;
  status: string;
  attempts: number;
  updatedAt: number;
}

const failureTypeLabels: Record<FailureType, string> = {
  'api-failure': 'API failure',
  'network-issue': 'Network issue',
  'rate-limit': 'Rate limit',
};

function loadErrorHandlingPlan(): ErrorHandlingPlan | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedPlan = window.localStorage.getItem(ERROR_PLAN_STORAGE_KEY);
  return storedPlan ? (JSON.parse(storedPlan) as ErrorHandlingPlan) : null;
}

function persistErrorHandlingPlan(plan: ErrorHandlingPlan) {
  window.localStorage.setItem(ERROR_PLAN_STORAGE_KEY, JSON.stringify(plan));
}

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
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);
  const [failureType, setFailureType] = useState<FailureType>('api-failure');
  const [details, setDetails] = useState('');
  const [inlineMessage, setInlineMessage] = useState('');
  const [savedPlan, setSavedPlan] = useState<ErrorHandlingPlan | null>(() =>
    loadErrorHandlingPlan(),
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedDetails = details.trim();
    if (!trimmedDetails) {
      setInlineMessage('Describe the error before saving a retry plan.');
      return;
    }

    const plan: ErrorHandlingPlan = {
      failureType,
      details: trimmedDetails,
      status: 'Ready to retry',
      attempts: savedPlan?.attempts ?? 0,
      updatedAt: Date.now(),
    };

    persistErrorHandlingPlan(plan);
    setSavedPlan(plan);
    setInlineMessage('');
    setDetails('');
  }

  function handleRetry() {
    if (!savedPlan) {
      return;
    }

    const retriedPlan = {
      ...savedPlan,
      attempts: savedPlan.attempts + 1,
      status: 'Retry queued',
      updatedAt: Date.now(),
    };

    persistErrorHandlingPlan(retriedPlan);
    setSavedPlan(retriedPlan);
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
        {savedPlan ? (
          <section className="saved-plan" aria-label="Saved error handling plan">
            <p className="status">{savedPlan.status}</p>
            <h2>{failureTypeLabels[savedPlan.failureType]}</h2>
            <p>{savedPlan.details}</p>
            <button type="button" onClick={handleRetry}>
              Retry now
            </button>
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
