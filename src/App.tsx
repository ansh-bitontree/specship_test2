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

type Message = {
  id: string;
  role: 'user';
  content: string;
  timestamp: number;
};

type Conversation = {
  messages: Message[];
  createdAt: number;
};

const conversationStorageKey = 'specship.conversation';

function readSavedConversation(): Message[] {
  const savedConversation = localStorage.getItem(conversationStorageKey);

  if (!savedConversation) {
    return [];
  }

  try {
    const parsedConversation = JSON.parse(savedConversation) as Partial<Conversation>;
    return Array.isArray(parsedConversation.messages) ? parsedConversation.messages : [];
  } catch {
    return [];
  }
}

export function App() {
  const [messages, setMessages] = useState<Message[]>(readSavedConversation);
  const [messageText, setMessageText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const conversation: Conversation = {
      messages,
      createdAt: messages[0]?.timestamp ?? Date.now(),
    };

    localStorage.setItem(conversationStorageKey, JSON.stringify(conversation));
  }, [messages]);
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);
  const [failureType, setFailureType] = useState<FailureType>('api-failure');
  const [details, setDetails] = useState('');
  const [inlineMessage, setInlineMessage] = useState('');
  const [savedPlan, setSavedPlan] = useState<ErrorHandlingPlan | null>(() =>
    loadErrorHandlingPlan(),
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = messageText.trim();

    if (!content) {
      setError('Enter a message before saving.');
      return;
    }

    const timestamp = Date.now();

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `${timestamp}-${currentMessages.length}`,
        role: 'user',
        content,
        timestamp,
      },
    ]);
    setMessageText('');
    setError('');
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
      <section className="conversation-workspace" aria-labelledby="message-history-heading">
        <div className="conversation-header">
          <p className="eyebrow">Authenticated workspace</p>
          <h1 id="message-history-heading">Message History</h1>
          <p>Save conversation notes and pick them back up after refreshing the browser.</p>
        </div>

        <form className="message-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="message-input">Message</label>
          <div className="message-form-row">
            <textarea
              id="message-input"
              name="message"
              rows={4}
              value={messageText}
              onChange={(event) => {
                setMessageText(event.target.value);
                if (error) {
                  setError('');
                }
              }}
            />
            <button type="submit">Save Message</button>
          </div>
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
        </form>

        <section className="history-panel" aria-labelledby="saved-conversation-heading">
          <h2 id="saved-conversation-heading">Saved conversation</h2>
          {messages.length > 0 ? (
            <ul aria-label="Saved conversation">
              {messages.map((message) => (
                <li key={message.id}>
                  <span>{message.content}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No messages saved yet.</p>
          )}
        </section>
      </section>
    </main>
  );
}
