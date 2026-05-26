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

export function App() {
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
      <section className="workspace">
        <h1>Specship Test2</h1>
        <p>React, TypeScript, Vite, and localStorage are ready for feature work.</p>

        <button className="primary-action" type="button" onClick={() => setIsWorkflowOpen(true)}>
          Error Handling
        </button>

        {isWorkflowOpen ? (
          <form className="error-workflow" onSubmit={handleSubmit}>
            <label>
              Failure type
              <select
                value={failureType}
                onChange={(event) => setFailureType(event.target.value as FailureType)}
              >
                <option value="api-failure">API failure</option>
                <option value="network-issue">Network issue</option>
                <option value="rate-limit">Rate limit</option>
              </select>
            </label>

            <label>
              What happened?
              <textarea
                aria-describedby={inlineMessage ? 'error-details-message' : undefined}
                value={details}
                onChange={(event) => {
                  setDetails(event.target.value);
                  if (inlineMessage) {
                    setInlineMessage('');
                  }
                }}
                placeholder="Example: Request timed out while loading account data"
              />
            </label>

            {inlineMessage ? (
              <p className="inline-message" id="error-details-message">
                {inlineMessage}
              </p>
            ) : null}

            <button className="primary-action" type="submit">
              Save retry plan
            </button>
          </form>
        ) : null}

        {savedPlan ? (
          <section className="saved-plan" aria-label="Saved error handling plan">
            <p className="status">{savedPlan.status}</p>
            <h2>{failureTypeLabels[savedPlan.failureType]}</h2>
            <p>{savedPlan.details}</p>
            <button type="button" onClick={handleRetry}>
              Retry now
            </button>
          </section>
        ) : null}
      </section>
    </main>
  );
}
