import './App.css';
import { useEffect, useState } from 'react';
import { browserStorageClient } from './server/storageClient';

type FailureType = 'api-failure' | 'network' | 'rate-limit';

interface RetryPlan {
  failureType: FailureType;
  details: string;
}

const retryPlanStorageKey = 'error-handling.retry-plan';

const failureTypeLabels: Record<FailureType, string> = {
  'api-failure': 'API failure',
  network: 'Network issue',
  'rate-limit': 'Rate limit',
};

export function App() {
  const [isErrorHandlingOpen, setIsErrorHandlingOpen] = useState(false);
  const [failureType, setFailureType] = useState<FailureType>('api-failure');
  const [details, setDetails] = useState('');
  const [retryPlan, setRetryPlan] = useState<RetryPlan | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const savedPlan = browserStorageClient?.get<RetryPlan>(retryPlanStorageKey) ?? null;

    if (savedPlan) {
      setRetryPlan(savedPlan);
      setFailureType(savedPlan.failureType);
      setDetails(savedPlan.details);
      setIsErrorHandlingOpen(true);
    }
  }, []);

  function saveRetryPlan() {
    const trimmedDetails = details.trim();

    if (!trimmedDetails) {
      setErrorMessage('Describe what failed before saving a retry plan.');
      return;
    }

    const nextPlan = {
      failureType,
      details: trimmedDetails,
    };

    browserStorageClient?.set(retryPlanStorageKey, nextPlan);
    setRetryPlan(nextPlan);
    setDetails(trimmedDetails);
    setErrorMessage('');
  }

  return (
    <main className="app-shell">
      <section className="intro-panel">
        <h1>Specship Test2</h1>
        <p>React, TypeScript, Vite, and localStorage are ready for feature work.</p>
        <button type="button" onClick={() => setIsErrorHandlingOpen(true)}>
          Open error handling
        </button>
      </section>

      {isErrorHandlingOpen ? (
        <section className="error-panel" aria-labelledby="error-handling-title">
          <div>
            <h2 id="error-handling-title">Error handling</h2>
            <p>
              Capture the failure, choose the type, and save a retry plan users can return
              to after refresh.
            </p>
          </div>

          <label>
            Failure type
            <select
              value={failureType}
              onChange={(event) => setFailureType(event.target.value as FailureType)}
            >
              <option value="api-failure">API failure</option>
              <option value="network">Network issue</option>
              <option value="rate-limit">Rate limit</option>
            </select>
          </label>

          <label>
            What failed
            <textarea
              aria-describedby={errorMessage ? 'retry-plan-error' : undefined}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              rows={4}
            />
          </label>

          {errorMessage ? (
            <p className="inline-error" id="retry-plan-error">
              {errorMessage}
            </p>
          ) : null}

          <button type="button" onClick={saveRetryPlan}>
            Save retry plan
          </button>

          {retryPlan ? (
            <aside className="retry-summary" aria-label="Saved retry plan">
              <strong>Retry plan saved</strong>
              <span>{failureTypeLabels[retryPlan.failureType]}</span>
              <p>{retryPlan.details}</p>
            </aside>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
