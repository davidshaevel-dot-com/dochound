# TT-122: Source Components Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build SourcePanel and SourceCard components to display RAG citations in a right sidebar.

**Architecture:** Right sidebar layout showing sources from the latest assistant message. Citation clicks in chat highlight the corresponding source card. Cards have expandable excerpts.

**Tech Stack:** React, TypeScript, Zustand, CSS Modules

---

## Task 1: Update chatStore with source selection state

**Files:**
- Modify: `packages/frontend/src/stores/chatStore.ts`

**Step 1: Add selectedSourceIndex and setSelectedSource to the store**

```typescript
interface ChatStore {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  selectedSourceIndex: number | null;

  addUserMessage: (content: string) => void;
  addAssistantMessage: (content: string, sources: Source[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
  setSelectedSource: (index: number | null) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isLoading: false,
  error: null,
  selectedSourceIndex: null,

  // ... existing actions ...

  clearMessages: () => set({ messages: [], error: null, selectedSourceIndex: null }),

  setSelectedSource: (index) => set({ selectedSourceIndex: index }),
}));
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 3: Commit**

```bash
git add packages/frontend/src/stores/chatStore.ts
git commit -m "feat(store): add selectedSourceIndex for citation highlighting

related-issues: TT-122

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Create SourceCard component

**Files:**
- Create: `packages/frontend/src/components/Sources/SourceCard.tsx`
- Create: `packages/frontend/src/components/Sources/SourceCard.module.css`

**Step 1: Create SourceCard.module.css**

```css
.card {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.card:hover {
  border-color: var(--color-accent);
}

.cardSelected {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px rgba(79, 195, 247, 0.2);
  background: rgba(79, 195, 247, 0.05);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-sm);
}

.documentName {
  font-weight: 500;
  color: var(--color-text);
  font-size: 0.875rem;
  margin: 0;
  flex: 1;
}

.citation {
  background: var(--color-primary);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  margin-left: var(--spacing-sm);
}

.scoreContainer {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.scoreBar {
  flex: 1;
  height: 4px;
  background: var(--color-border);
  border-radius: 2px;
  overflow: hidden;
}

.scoreFill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s ease;
}

.scoreText {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  min-width: 32px;
}

.excerpt {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  line-height: 1.5;
  margin: 0;
}

.excerptTruncated {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.expandButton {
  background: none;
  border: none;
  color: var(--color-accent);
  font-size: 0.75rem;
  padding: 0;
  margin-top: var(--spacing-xs);
  cursor: pointer;
}

.expandButton:hover {
  text-decoration: underline;
}
```

**Step 2: Create SourceCard.tsx**

```typescript
import { useState } from 'react';
import { Source } from '@/api/client';
import styles from './SourceCard.module.css';

interface SourceCardProps {
  source: Source;
  index: number;
  isSelected: boolean;
  onSelect: (index: number) => void;
}

export function SourceCard({ source, index, isSelected, onSelect }: SourceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    onSelect(index);
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const scorePercent = Math.round(source.score * 100);
  const needsTruncation = source.excerpt.length > 150;

  return (
    <div
      className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
      onClick={handleClick}
    >
      <div className={styles.header}>
        <h4 className={styles.documentName}>{source.documentName}</h4>
        <span className={styles.citation}>[{index + 1}]</span>
      </div>

      <div className={styles.scoreContainer}>
        <div className={styles.scoreBar}>
          <div
            className={styles.scoreFill}
            style={{ width: `${scorePercent}%` }}
          />
        </div>
        <span className={styles.scoreText}>{scorePercent}%</span>
      </div>

      <p className={`${styles.excerpt} ${!isExpanded && needsTruncation ? styles.excerptTruncated : ''}`}>
        {source.excerpt}
      </p>

      {needsTruncation && (
        <button className={styles.expandButton} onClick={handleExpandClick}>
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}
```

**Step 3: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add packages/frontend/src/components/Sources/SourceCard.tsx packages/frontend/src/components/Sources/SourceCard.module.css
git commit -m "feat(sources): add SourceCard component

- Display document name, relevance score bar, excerpt
- Expandable/collapsible excerpt for long content
- Highlighted state when selected
- Citation badge showing index

related-issues: TT-122

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Create SourcePanel component

**Files:**
- Create: `packages/frontend/src/components/Sources/SourcePanel.tsx`
- Create: `packages/frontend/src/components/Sources/SourcePanel.module.css`

**Step 1: Create SourcePanel.module.css**

```css
.panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-background-alt);
  overflow: hidden;
}

.header {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}

.count {
  background: var(--color-primary);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
}

.emptyState {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  text-align: center;
  padding: var(--spacing-lg);
}
```

**Step 2: Create SourcePanel.tsx**

```typescript
import { useChatStore } from '@/stores/chatStore';
import { SourceCard } from './SourceCard';
import styles from './SourcePanel.module.css';

export function SourcePanel() {
  const { messages, selectedSourceIndex, setSelectedSource } = useChatStore();

  // Get sources from the latest assistant message
  const latestAssistantMessage = [...messages]
    .reverse()
    .find((m) => m.role === 'assistant');

  const sources = latestAssistantMessage?.sources ?? [];

  const handleSelect = (index: number) => {
    // Toggle selection if clicking the same source
    setSelectedSource(selectedSourceIndex === index ? null : index);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Sources</h3>
        {sources.length > 0 && (
          <span className={styles.count}>{sources.length}</span>
        )}
      </div>

      <div className={styles.content}>
        {sources.length === 0 ? (
          <div className={styles.emptyState}>
            Sources will appear here when you ask a question
          </div>
        ) : (
          sources.map((source, index) => (
            <SourceCard
              key={`${source.documentId}-${index}`}
              source={source}
              index={index}
              isSelected={selectedSourceIndex === index}
              onSelect={handleSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}
```

**Step 3: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add packages/frontend/src/components/Sources/SourcePanel.tsx packages/frontend/src/components/Sources/SourcePanel.module.css
git commit -m "feat(sources): add SourcePanel container component

- Displays sources from latest assistant message
- Header with source count badge
- Empty state when no sources available
- Handles source selection toggle

related-issues: TT-122

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Create barrel export

**Files:**
- Create: `packages/frontend/src/components/Sources/index.ts`

**Step 1: Create index.ts**

```typescript
export { SourcePanel } from './SourcePanel';
export { SourceCard } from './SourceCard';
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add packages/frontend/src/components/Sources/index.ts
git commit -m "feat(sources): add barrel export for Sources components

related-issues: TT-122

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Update App layout for sidebar

**Files:**
- Modify: `packages/frontend/src/App.tsx`
- Modify: `packages/frontend/src/App.module.css`

**Step 1: Update App.module.css with sidebar layout**

Add/modify these styles:

```css
.content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.sidebar {
  width: 320px;
  border-left: 1px solid var(--color-border);
  flex-shrink: 0;
}
```

**Step 2: Update App.tsx to include SourcePanel**

```typescript
import { useTenantStore } from './stores/tenantStore';
import { useTenants } from './hooks';
import { ChatPanel } from './components/Chat';
import { SourcePanel } from './components/Sources';
import styles from './App.module.css';

// ... FALLBACK_TENANTS stays the same ...

function App() {
  const { currentTenant, setTenant } = useTenantStore();
  const { data: tenants, isLoading, isError } = useTenants();

  const availableTenants = tenants ?? (isError ? FALLBACK_TENANTS : []);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        {/* ... header content stays the same ... */}
      </header>
      <div className={styles.content}>
        <main className={styles.main}>
          <ChatPanel />
        </main>
        <aside className={styles.sidebar}>
          <SourcePanel />
        </aside>
      </div>
    </div>
  );
}
```

**Step 3: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add packages/frontend/src/App.tsx packages/frontend/src/App.module.css
git commit -m "feat(layout): add sidebar layout with SourcePanel

- Add content wrapper for main + sidebar layout
- Sidebar fixed at 320px width
- Main area takes remaining space

related-issues: TT-122

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Integrate citation click handler

**Files:**
- Modify: `packages/frontend/src/components/Chat/ChatPanel.tsx`

**Step 1: Update handleCitationClick to use setSelectedSource**

```typescript
import { useEffect } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useTenantStore } from '@/stores/tenantStore';
import { useChat } from '@/hooks';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import styles from './ChatPanel.module.css';

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
    setSelectedSource,
  } = useChatStore();

  // ... useChat hook stays the same ...

  // Clear messages when tenant changes
  useEffect(() => {
    clearMessages();
  }, [currentTenant]);

  // ... handleSubmit stays the same ...

  const handleCitationClick = (index: number) => {
    setSelectedSource(index);
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

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add packages/frontend/src/components/Chat/ChatPanel.tsx
git commit -m "feat(chat): integrate citation click with source selection

- handleCitationClick now calls setSelectedSource
- Clicking [1] in chat highlights SourceCard[0] in sidebar

related-issues: TT-122

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Manual Testing

**Test Plan:**

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Empty state | Load app without sending message | SourcePanel shows "Sources will appear here..." |
| Sources display | Send a question, receive response | SourcePanel shows sources with name, score, excerpt |
| Citation click | Click [1] in assistant message | SourceCard[0] highlights in sidebar |
| Source card click | Click a source card | Card highlights, clicking again deselects |
| Expand excerpt | Click "Show more" on long excerpt | Full excerpt displays |
| Collapse excerpt | Click "Show less" | Excerpt truncates again |
| Tenant change | Switch tenant | Sources panel clears |
| Score display | Check score bar | Bar width matches percentage |

**Run dev server:**

```bash
cd packages/frontend && npm run dev
```

Open http://localhost:5173 and test each scenario.

---

## Task 8: Create PR

**Step 1: Push branch**

```bash
git push -u origin david/tt-122-implement-source-components-sourcepanel-sourcecard
```

**Step 2: Create PR**

```bash
gh pr create --title "TT-122: Implement Source components (SourcePanel, SourceCard)" --body "$(cat <<'EOF'
## Summary
- Add SourcePanel sidebar showing sources from latest assistant response
- Add SourceCard with document name, relevance score bar, expandable excerpt
- Integrate citation clicks to highlight corresponding source
- Update App layout for main + sidebar structure

## Test plan
- [ ] Empty state displays when no messages
- [ ] Sources appear after assistant responds
- [ ] Citation [1] click highlights first source card
- [ ] Source cards expand/collapse excerpts
- [ ] Tenant change clears sources
- [ ] Score bars display correctly

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Summary

| Task | Files |
|------|-------|
| 1 | `stores/chatStore.ts` |
| 2 | `components/Sources/SourceCard.tsx`, `.module.css` |
| 3 | `components/Sources/SourcePanel.tsx`, `.module.css` |
| 4 | `components/Sources/index.ts` |
| 5 | `App.tsx`, `App.module.css` |
| 6 | `components/Chat/ChatPanel.tsx` |
| 7 | Manual testing |
| 8 | PR creation |
