import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import './App.css';

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
