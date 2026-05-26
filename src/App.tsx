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
