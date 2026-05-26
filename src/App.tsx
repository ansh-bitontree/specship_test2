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
  }

  return (
    <main className="app-shell">
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
      </section>
    </main>
  );
}
