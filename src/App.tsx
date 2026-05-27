import { type FormEvent, useMemo, useState } from 'react';
import './App.css';
import { browserStorageClient } from './server/storageClient';

type MessageRole = 'user' | 'gemini';

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

interface Conversation {
  createdAt: number;
  messages: ChatMessage[];
}

const conversationKey = 'scichat:conversation';

function emptyConversation(): Conversation {
  return {
    createdAt: Date.now(),
    messages: [],
  };
}

function loadConversation(): Conversation {
  try {
    return browserStorageClient?.get<Conversation>(conversationKey) ?? emptyConversation();
  } catch {
    browserStorageClient?.remove(conversationKey);
    return emptyConversation();
  }
}

function createMessage(role: MessageRole, content: string): ChatMessage {
  const timestamp = Date.now();

  return {
    id: `${role}-${timestamp}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
    timestamp,
  };
}

function saveConversation(conversation: Conversation) {
  browserStorageClient?.set(conversationKey, conversation);
}

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(timestamp);
}

function readApiError(payload: unknown) {
  if (
    payload &&
    typeof payload === 'object' &&
    'detail' in payload &&
    typeof payload.detail === 'string'
  ) {
    return payload.detail;
  }

  return 'Gemini request failed. Try again.';
}

export function App() {
  const [conversation, setConversation] = useState(loadConversation);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);

  const sortedMessages = useMemo(
    () => [...conversation.messages].sort((left, right) => left.timestamp - right.timestamp),
    [conversation.messages],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

      const payload = (await response.json()) as unknown;
      if (!response.ok) {
        throw new Error(readApiError(payload));
      }

      const content =
        payload &&
        typeof payload === 'object' &&
        'content' in payload &&
        typeof payload.content === 'string'
          ? payload.content
          : '';

      const nextConversation = {
        ...conversation,
        messages: [
          ...conversation.messages,
          createMessage('user', trimmedMessage),
          createMessage('gemini', content),
        ],
      };

      setConversation(nextConversation);
      saveConversation(nextConversation);
      setMessage('');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Gemini request failed. Try again.',
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="workspace-header">
          <p className="eyebrow">Gemini research assistant</p>
          <h1>SciChat</h1>
          <p>
            Ask science questions locally through the FastAPI Gemini proxy.
          </p>
        </header>

        <section className="chat-panel" aria-label="SciChat conversation">
          <div className="message-list" role="log" aria-label="Conversation">
            {sortedMessages.length === 0 ? (
              <p className="empty-state">No messages yet.</p>
            ) : (
              sortedMessages.map((chatMessage) => (
                <article
                  className={`message message-${chatMessage.role}`}
                  key={chatMessage.id}
                >
                  <div className="message-meta">
                    <span>{chatMessage.role === 'user' ? 'User' : 'Gemini'}</span>
                    <time dateTime={new Date(chatMessage.timestamp).toISOString()}>
                      {formatTime(chatMessage.timestamp)}
                    </time>
                  </div>
                  <p>{chatMessage.content}</p>
                </article>
              ))
            )}
          </div>

          <form className="chat-form" onSubmit={handleSubmit}>
            <label htmlFor="chat-message">Message</label>
            <div className="input-row">
              <textarea
                id="chat-message"
                name="message"
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Ask Gemini about a scientific topic..."
                value={message}
              />
              <button disabled={isSending} type="submit">
                {isSending ? 'Sending...' : 'Send'}
              </button>
            </div>
            {error ? <p className="form-error">{error}</p> : null}
          </form>
        </section>
      </section>
    </main>
  );
}
