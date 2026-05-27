import { FormEvent, useMemo, useState } from 'react';
import './App.css';
import { browserStorageClient } from './server/storageClient';

type Sender = 'user' | 'ai';

interface ChatMessage {
  id: string;
  role: Sender;
  content: string;
  timestamp: number;
}

interface ConversationState {
  messages: ChatMessage[];
  createdAt: number;
}

const conversationKey = 'specship-chat-conversation';

function createMessage(role: Sender, content: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
    timestamp: Date.now(),
  };
}

function loadConversation(): ConversationState {
  return (
    browserStorageClient?.get<ConversationState>(conversationKey) ?? {
      messages: [],
      createdAt: Date.now(),
    }
  );
}

function saveConversation(conversation: ConversationState) {
  browserStorageClient?.set(conversationKey, conversation);
}

function formatTimestamp(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(timestamp);
}

export function App() {
  const [conversation, setConversation] = useState(loadConversation);
  const [isChatOpen, setIsChatOpen] = useState(() => conversation.messages.length > 0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const hasMessages = conversation.messages.length > 0;

  const sortedMessages = useMemo(
    () => [...conversation.messages].sort((left, right) => left.timestamp - right.timestamp),
    [conversation.messages],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
import { useState } from 'react';
import './App.css';
import type { Conversation } from './domain/models';
import { browserStorageClient } from './server/storageClient';

const CONVERSATION_STORAGE_KEY = 'specship:conversation';
const CLEAR_CONFIRMATION = 'CLEAR';

function loadConversation(): Conversation {
  return (
    browserStorageClient?.get<Conversation>(CONVERSATION_STORAGE_KEY) ?? {
      createdAt: Date.now(),
      messages: [],
    }
  );
}

export function App() {
  const [conversation, setConversation] = useState(loadConversation);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [clearError, setClearError] = useState('');
  const hasMessages = conversation.messages.length > 0;
  const clearErrorId = 'clear-chat-error';

  function clearConversation() {
    if (confirmation !== CLEAR_CONFIRMATION) {
      setClearError('Type CLEAR to clear the chat.');
      return;
    }

    browserStorageClient?.remove(CONVERSATION_STORAGE_KEY);
    setConversation({ createdAt: Date.now(), messages: [] });
    setConfirmation('');
    setClearError('');
    setIsConfirmingClear(false);
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

    const nextConversation = {
      ...conversation,
      messages: [
        ...conversation.messages,
        createMessage('user', trimmedMessage),
        createMessage('ai', `Received: ${trimmedMessage}`),
      ],
    };

    setConversation(nextConversation);
    saveConversation(nextConversation);
    setMessage('');
    setError('');
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
      <section className="workspace-overview" aria-labelledby="workspace-title">
        <div>
          <h1 id="workspace-title">Specship Test2</h1>
          <p>React, TypeScript, Vite, and localStorage are ready for feature work.</p>
        </div>
        <button className="primary-action" type="button" onClick={() => setIsChatOpen(true)}>
          Open chat
        </button>
      <section className="chat-panel">
        <h1>Specship Test2</h1>

        <div className="chat-panel__header">
          <p>React, TypeScript, Vite, and localStorage are ready for feature work.</p>
          <button type="button" onClick={() => setIsConfirmingClear(true)}>
            Clear chat
          </button>
        </div>

        <div className="message-list" aria-live="polite">
          {hasMessages ? (
            conversation.messages.map((message) => (
              <article className="message" key={message.id}>
                <span>{message.role}</span>
                <p>{message.content}</p>
              </article>
            ))
          ) : (
            <p>No messages yet.</p>
          )}
        </div>

        {isConfirmingClear ? (
          <form
            className="clear-chat-form"
            onSubmit={(event) => {
              event.preventDefault();
              clearConversation();
            }}
          >
            <label htmlFor="clearConfirmation">Type CLEAR to confirm</label>
            <div>
              <input
                aria-describedby={clearError ? clearErrorId : undefined}
                id="clearConfirmation"
                name="clearConfirmation"
                onChange={(event) => {
                  setConfirmation(event.target.value);
                  setClearError('');
                }}
                value={confirmation}
              />
              <button type="submit">Clear conversation</button>
            </div>
            {clearError ? (
              <p className="clear-chat-form__error" id={clearErrorId} role="alert">
                {clearError}
              </p>
            ) : null}
          </form>
        ) : null}
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

      {isChatOpen ? (
        <section className="chat-panel" aria-labelledby="chat-title">
          <div className="chat-header">
            <div>
              <h2 id="chat-title">Chat</h2>
              <p>{hasMessages ? 'Conversation saved locally.' : 'Start a new conversation.'}</p>
            </div>
          </div>

          <div className="message-list" aria-live="polite">
            {hasMessages ? (
              sortedMessages.map((chatMessage) => (
                <article className={`message message-${chatMessage.role}`} key={chatMessage.id}>
                  <div className="message-meta">
                    <span>{chatMessage.role === 'user' ? 'User' : 'AI'}</span>
                    <time dateTime={new Date(chatMessage.timestamp).toISOString()}>
                      {formatTimestamp(chatMessage.timestamp)}
                    </time>
                  </div>
                  <p>{chatMessage.content}</p>
                </article>
              ))
            ) : (
              <p className="empty-state">No messages yet.</p>
            )}
          </div>

          <form className="chat-form" onSubmit={handleSubmit} noValidate>
            <label htmlFor="chat-message">Message</label>
            <div className="input-row">
              <textarea
                aria-describedby={error ? 'chat-error' : undefined}
                id="chat-message"
                onChange={(event) => {
                  setMessage(event.target.value);
                  if (error) {
                    setError('');
                  }
                }}
                placeholder="Type a message"
                rows={3}
                value={message}
              />
              <button type="submit">Send message</button>
            </div>
            {error ? (
              <p className="form-error" id="chat-error" role="alert">
                {error}
              </p>
            ) : null}
          </form>
        </section>
      ) : null}
    </main>
  );
}
