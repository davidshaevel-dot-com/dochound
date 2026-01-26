# TT-121: Chat Components Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the core chat interface components (ChatPanel, MessageList, Message, MessageInput) with Zustand state management.

**Architecture:** Zustand store holds conversation state (messages, loading, error). ChatPanel orchestrates the flow: user submits → message added to store → API call via useChat hook → response added to store. Components are pure presentational except ChatPanel which handles side effects.

**Tech Stack:** React, TypeScript, Zustand, React Query (existing useChat hook), CSS Modules

**Design Doc:** [docs/plans/2026-01-26-tt-121-chat-components-design.md](./2026-01-26-tt-121-chat-components-design.md)

---

## Task 1: Create Chat Store (Zustand)

**Files:**
- Create: `packages/frontend/src/stores/chatStore.ts`
- Modify: `packages/frontend/src/stores/index.ts` (add export)

**Step 1: Create the chat store**

```typescript
// packages/frontend/src/stores/chatStore.ts
import { create } from 'zustand';
import { ChatMessage, Source } from '@/api/client';

interface ChatStore {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;

  addUserMessage: (content: string) => void;
  addAssistantMessage: (content: string, sources: Source[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isLoading: false,
  error: null,

  addUserMessage: (content) =>
    set((state) => ({
      messages: [...state.messages, { role: 'user', content }],
      error: null,
    })),

  addAssistantMessage: (content, sources) =>
    set((state) => ({
      messages: [...state.messages, { role: 'assistant', content, sources }],
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ isLoading: false, error }),

  clearMessages: () => set({ messages: [], error: null }),
}));
```

**Step 2: Update stores barrel export**

```typescript
// packages/frontend/src/stores/index.ts
export { useTenantStore } from './tenantStore';
export { useChatStore } from './chatStore';
```

**Step 3: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add packages/frontend/src/stores/chatStore.ts packages/frontend/src/stores/index.ts
git commit -m "feat(chat): add chat store for conversation state

Zustand store managing messages, loading, and error state.

related-issues: TT-121

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Create Message Component

**Files:**
- Create: `packages/frontend/src/components/Chat/Message.tsx`
- Create: `packages/frontend/src/components/Chat/Message.module.css`

**Step 1: Create Message component**

```typescript
// packages/frontend/src/components/Chat/Message.tsx
import { ChatMessage } from '@/api/client';
import styles from './Message.module.css';

interface MessageProps {
  message: ChatMessage;
  onCitationClick?: (index: number) => void;
}

/**
 * Renders a single chat message with citation support
 */
export function Message({ message, onCitationClick }: MessageProps) {
  const isUser = message.role === 'user';

  // Parse content for citation patterns [1], [2], etc.
  const renderContent = () => {
    const parts = message.content.split(/(\[\d+\])/g);

    return parts.map((part, i) => {
      const citationMatch = part.match(/\[(\d+)\]/);
      if (citationMatch) {
        const index = parseInt(citationMatch[1], 10) - 1;
        const hasSource = message.sources && message.sources[index];

        if (hasSource && onCitationClick) {
          return (
            <button
              key={i}
              className={styles.citation}
              onClick={() => onCitationClick(index)}
              type="button"
            >
              {part}
            </button>
          );
        }
        // Render as plain text if no matching source
        return <span key={i}>{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div
      className={`${styles.message} ${isUser ? styles.user : styles.assistant}`}
    >
      <div className={styles.content}>{renderContent()}</div>
    </div>
  );
}
```

**Step 2: Create Message styles**

```css
/* packages/frontend/src/components/Chat/Message.module.css */
.message {
  max-width: 80%;
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-sm);
}

.user {
  align-self: flex-end;
  background-color: var(--color-primary);
  color: white;
}

.assistant {
  align-self: flex-start;
  background-color: var(--color-background-alt);
  color: var(--color-text);
}

.content {
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.5;
}

.citation {
  background: none;
  border: none;
  padding: 0;
  color: var(--color-accent);
  cursor: pointer;
  font-size: inherit;
  font-family: inherit;
  text-decoration: underline;
}

.citation:hover {
  text-decoration: none;
}

.citation:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

**Step 3: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add packages/frontend/src/components/Chat/Message.tsx packages/frontend/src/components/Chat/Message.module.css
git commit -m "feat(chat): add Message component with citation support

Renders user/assistant messages with clickable citation links.

related-issues: TT-121

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Create MessageInput Component

**Files:**
- Create: `packages/frontend/src/components/Chat/MessageInput.tsx`
- Create: `packages/frontend/src/components/Chat/MessageInput.module.css`

**Step 1: Create MessageInput component**

```typescript
// packages/frontend/src/components/Chat/MessageInput.tsx
import { useState, FormEvent, KeyboardEvent } from 'react';
import styles from './MessageInput.module.css';

interface MessageInputProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
  error?: string | null;
}

/**
 * Chat input form with submit button
 */
export function MessageInput({ onSubmit, disabled, error }: MessageInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed && !disabled) {
      onSubmit(trimmed);
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter, newline on Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.inputRow}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question..."
          disabled={disabled}
          className={styles.textarea}
          rows={1}
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className={styles.button}
        >
          {disabled ? 'Sending...' : 'Send'}
        </button>
      </div>
    </form>
  );
}
```

**Step 2: Create MessageInput styles**

```css
/* packages/frontend/src/components/Chat/MessageInput.module.css */
.form {
  padding: var(--spacing-md);
  background: var(--color-background);
  border-top: 1px solid var(--color-border);
}

.error {
  color: #dc2626;
  font-size: 0.875rem;
  margin-bottom: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: #fef2f2;
  border-radius: var(--radius-sm);
}

.inputRow {
  display: flex;
  gap: var(--spacing-sm);
  align-items: flex-end;
}

.textarea {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-family: inherit;
  resize: none;
  min-height: 44px;
  max-height: 120px;
  line-height: 1.5;
}

.textarea:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px rgba(79, 195, 247, 0.2);
}

.textarea:disabled {
  background: var(--color-background-alt);
  cursor: not-allowed;
}

.button {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
  transition: background-color 0.15s;
}

.button:hover:not(:disabled) {
  background: var(--color-primary-light);
}

.button:disabled {
  background: var(--color-text-muted);
  cursor: not-allowed;
}
```

**Step 3: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add packages/frontend/src/components/Chat/MessageInput.tsx packages/frontend/src/components/Chat/MessageInput.module.css
git commit -m "feat(chat): add MessageInput component

Form with textarea and submit button, Enter to send, Shift+Enter for newline.

related-issues: TT-121

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Create MessageList Component

**Files:**
- Create: `packages/frontend/src/components/Chat/MessageList.tsx`

**Step 1: Create MessageList component**

```typescript
// packages/frontend/src/components/Chat/MessageList.tsx
import { useEffect, useRef } from 'react';
import { ChatMessage } from '@/api/client';
import { Message } from './Message';
import styles from './ChatPanel.module.css';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  onCitationClick?: (index: number) => void;
}

/**
 * Scrollable list of chat messages with auto-scroll
 */
export function MessageList({ messages, isLoading, onCitationClick }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className={styles.messageList}>
        <div className={styles.emptyState}>
          Ask a question to get started
        </div>
      </div>
    );
  }

  return (
    <div className={styles.messageList}>
      {messages.map((message, index) => (
        <Message
          key={index}
          message={message}
          onCitationClick={onCitationClick}
        />
      ))}
      {isLoading && (
        <div className={styles.loading}>
          Thinking...
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds (will fail until ChatPanel.module.css exists - that's ok, we'll create it next)

**Step 3: Commit**

```bash
git add packages/frontend/src/components/Chat/MessageList.tsx
git commit -m "feat(chat): add MessageList component

Scrollable message list with auto-scroll and empty state.

related-issues: TT-121

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Create ChatPanel Component

**Files:**
- Create: `packages/frontend/src/components/Chat/ChatPanel.tsx`
- Create: `packages/frontend/src/components/Chat/ChatPanel.module.css`
- Create: `packages/frontend/src/components/Chat/index.ts`

**Step 1: Create ChatPanel component**

```typescript
// packages/frontend/src/components/Chat/ChatPanel.tsx
import { useEffect } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useTenantStore } from '@/stores/tenantStore';
import { useChat } from '@/hooks';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import styles from './ChatPanel.module.css';

/**
 * Main chat container - orchestrates message flow
 */
export function ChatPanel() {
  const { currentTenant } = useTenantStore();
  const {
    messages,
    isLoading,
    error,
    addUserMessage,
    addAssistantMessage,
    setLoading,
    setError,
    clearMessages,
  } = useChatStore();

  const chat = useChat({
    tenantId: currentTenant,
    onSuccess: (data) => {
      addAssistantMessage(data.message, data.sources);
      setLoading(false);
    },
    onError: (err) => {
      setError(err.message || 'Failed to send message. Please try again.');
    },
  });

  // Clear messages when tenant changes
  useEffect(() => {
    clearMessages();
  }, [currentTenant, clearMessages]);

  const handleSubmit = (message: string) => {
    addUserMessage(message);
    setLoading(true);
    setError(null);
    chat.mutate(message);
  };

  const handleCitationClick = (index: number) => {
    // TODO: Integrate with Sources panel (TT-122)
    console.log('Citation clicked:', index);
  };

  return (
    <div className={styles.panel}>
      <MessageList
        messages={messages}
        isLoading={isLoading}
        onCitationClick={handleCitationClick}
      />
      <MessageInput
        onSubmit={handleSubmit}
        disabled={isLoading}
        error={error}
      />
    </div>
  );
}
```

**Step 2: Create ChatPanel styles**

```css
/* packages/frontend/src/components/Chat/ChatPanel.module.css */
.panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-background);
}

.messageList {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
}

.emptyState {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  font-size: 1.125rem;
}

.loading {
  align-self: flex-start;
  padding: var(--spacing-md);
  background: var(--color-background-alt);
  border-radius: var(--radius-lg);
  color: var(--color-text-muted);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

**Step 3: Create barrel export**

```typescript
// packages/frontend/src/components/Chat/index.ts
export { ChatPanel } from './ChatPanel';
export { Message } from './Message';
export { MessageList } from './MessageList';
export { MessageInput } from './MessageInput';
```

**Step 4: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add packages/frontend/src/components/Chat/
git commit -m "feat(chat): add ChatPanel container component

Orchestrates chat flow: user input -> store -> API -> response.

related-issues: TT-121

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Integrate ChatPanel into App

**Files:**
- Modify: `packages/frontend/src/App.tsx`
- Modify: `packages/frontend/src/App.module.css`

**Step 1: Update App.tsx to include ChatPanel**

```typescript
// packages/frontend/src/App.tsx
import { useTenantStore } from './stores/tenantStore';
import { useTenants } from './hooks';
import { ChatPanel } from './components/Chat';
import styles from './App.module.css';

// Fallback tenants when API is unavailable (graceful degradation)
// TODO: For production, consider disabling the selector on error instead of falling back
const FALLBACK_TENANTS = [
  { id: 'interview-prep', name: 'Interview Prep', documentCount: 0 },
  { id: 'manufacturing-demo', name: 'Manufacturing Demo', documentCount: 0 },
];

function App() {
  const { currentTenant, setTenant } = useTenantStore();
  const { data: tenants, isLoading, isError } = useTenants();

  // Use API tenants if available, otherwise fall back to hardcoded list
  const availableTenants = tenants ?? (isError ? FALLBACK_TENANTS : []);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>DocHound</h1>
        <p className={styles.tagline}>Sniff out answers from your technical documents</p>
        <div className={styles.tenantSelector}>
          <label htmlFor="tenant-select">Tenant:</label>
          <select
            id="tenant-select"
            value={currentTenant}
            onChange={(e) => setTenant(e.target.value)}
            disabled={isLoading}
          >
            {isLoading ? (
              <option>Loading...</option>
            ) : (
              availableTenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))
            )}
          </select>
        </div>
      </header>
      <main className={styles.main}>
        <ChatPanel />
      </main>
    </div>
  );
}

export default App;
```

**Step 2: Update App styles for full-height chat**

Replace the `.main` styles in `App.module.css`:

```css
/* In packages/frontend/src/App.module.css - replace .main block */
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
```

Also remove the `.main p` and `.main strong` rules as they're no longer needed.

**Step 3: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add packages/frontend/src/App.tsx packages/frontend/src/App.module.css
git commit -m "feat(chat): integrate ChatPanel into App

Replaces placeholder with functional chat interface.

related-issues: TT-121

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Manual Testing & Verification

**Step 1: Start frontend dev server**

Run: `npm run dev`
Expected: Vite starts on http://localhost:5173

**Step 2: Manual verification checklist**

Open http://localhost:5173 and verify:

- [ ] Chat panel displays with empty state "Ask a question to get started"
- [ ] Can type in input field
- [ ] Send button disabled when input empty
- [ ] Enter submits message (Shift+Enter adds newline)
- [ ] User message appears immediately (right-aligned, dark background)
- [ ] Loading state shows "Thinking..." and disables input
- [ ] Error handling works (if backend not running, error shows below input)
- [ ] Changing tenant clears messages

**Note:** Full end-to-end testing requires backend running. For now, verify UI behavior with API errors.

**Step 3: Run linting**

Run: `npm run lint`
Expected: No errors

**Step 4: Final build verification**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Commit any fixes if needed**

If any issues found during manual testing, fix and commit separately.

---

## Task 8: Update Linear Issue & Create PR

**Step 1: Update Linear issue status**

Move TT-121 to "In Review"

**Step 2: Push branch**

```bash
git push -u origin david/tt-121-implement-chat-components-chatpanel-messagelist-message
```

**Step 3: Create PR**

```bash
gh pr create --title "TT-121: Implement Chat components" --body "$(cat <<'EOF'
## Summary
- Add chat store (Zustand) for conversation state management
- Create Message component with citation link support
- Create MessageInput component with Enter-to-send
- Create MessageList component with auto-scroll
- Create ChatPanel container to orchestrate flow
- Integrate into App, replacing placeholder

## Test plan
- [ ] Chat panel displays with empty state
- [ ] Can type and send messages
- [ ] User messages appear right-aligned
- [ ] Loading state shows "Thinking..."
- [ ] Error state displays below input
- [ ] Tenant change clears messages
- [ ] Citations render as clickable links (visual only until TT-122)

## Design
See [docs/plans/2026-01-26-tt-121-chat-components-design.md](docs/plans/2026-01-26-tt-121-chat-components-design.md)

related-issues: TT-121

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Chat Store | `stores/chatStore.ts` |
| 2 | Message Component | `components/Chat/Message.tsx`, `.module.css` |
| 3 | MessageInput Component | `components/Chat/MessageInput.tsx`, `.module.css` |
| 4 | MessageList Component | `components/Chat/MessageList.tsx` |
| 5 | ChatPanel Component | `components/Chat/ChatPanel.tsx`, `.module.css`, `index.ts` |
| 6 | App Integration | `App.tsx`, `App.module.css` |
| 7 | Manual Testing | - |
| 8 | PR Creation | - |
