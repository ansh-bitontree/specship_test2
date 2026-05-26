import './App.css';
import { type FormEvent, useState } from 'react';
import type { Conversation, Message } from './domain/models';

const CONVERSATION_KEY = 'specship.chat.conversation';

function createEmptyConversation(now = Date.now()): Conversation {
  return {
    messages: [],
    createdAt: now,
  };
}

function loadConversation(): Conversation {
  const saved = localStorage.getItem(CONVERSATION_KEY);
  if (!saved) {
    return createEmptyConversation();
  }

  try {
    const conversation = JSON.parse(saved) as Conversation;
    return Array.isArray(conversation.messages) ? conversation : createEmptyConversation();
  } catch {
    return createEmptyConversation();
  }
}

function saveConversation(conversation: Conversation) {
  localStorage.setItem(CONVERSATION_KEY, JSON.stringify(conversation));
}

function formatTimestamp(timestamp: number) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(timestamp);
}

function buildMessage(
  role: Message['role'],
  content: string,
  timestamp: number,
  position: number,
): Message {
  return {
    id: `${role}-${timestamp}-${position}`,
    role,
    content,
    timestamp,
  };
}

export function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [conversation, setConversation] = useState<Conversation>(() => loadConversation());
  const [error, setError] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const content = String(new FormData(form).get('message') ?? '').trim();
    if (!content) {
      setError('Enter a message before sending.');
      return;
    }

    const timestamp = Date.now();
    const nextPosition = conversation.messages.length;
    const userMessage = buildMessage('user', content, timestamp, nextPosition);
    const aiMessage = buildMessage('ai', `I received: ${content}`, timestamp, nextPosition + 1);
    const nextConversation = {
      ...conversation,
      messages: [...conversation.messages, userMessage, aiMessage],
    };

    setConversation(nextConversation);
    saveConversation(nextConversation);
    form.reset();
    setError('');
  }

  return (
    <main className="app-shell">
      <section className="workspace-panel" aria-labelledby="workspace-title">
        <div className="workspace-header">
          <div>
            <p className="eyebrow">Authenticated workspace</p>
            <h1 id="workspace-title">Specship Test2</h1>
          </div>
          <button
            className="chat-entry"
            data-testid="chat-entry"
            type="button"
            onClick={() => setIsChatOpen(true)}
          >
            Open chat
          </button>
        </div>
        <p className="workspace-copy">
          React, TypeScript, Vite, and localStorage are ready for feature work.
        </p>

        {isChatOpen ? (
          <section className="chat-panel" aria-label="Chat interface">
            <div className="message-list" aria-live="polite">
              {conversation.messages.length === 0 ? (
                <p className="empty-state">Start a conversation to see messages here.</p>
              ) : (
                conversation.messages.map((message) => (
                  <article className={`message message-${message.role}`} key={message.id}>
                    <div className="message-meta">
                      <span>{message.role === 'user' ? 'You' : 'AI'}</span>
                      <time dateTime={new Date(message.timestamp).toISOString()}>
                        {formatTimestamp(message.timestamp)}
                      </time>
                    </div>
                    <p>{message.content}</p>
                  </article>
                ))
              )}
            </div>

            <form className="chat-form" onSubmit={handleSubmit} noValidate>
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                placeholder="Type a message"
                rows={3}
              />
              {error ? (
                <p className="form-error" role="alert">
                  {error}
                </p>
              ) : null}
              <button type="submit">Send</button>
            </form>
          </section>
        ) : null}
      </section>
    </main>
  );
}
