# TT-122: Source Components Design

**Date:** January 26, 2026
**Issue:** [TT-122](https://linear.app/davidshaevel-dot-com/issue/TT-122)
**Status:** Approved

## Overview

Build the source citation display components for DocHound. These components show the retrieved document sources that support the AI's answers, enabling users to verify and explore citations.

## Layout

**Right sidebar, always visible** alongside chat panel. This pattern:
- Immediately showcases RAG capability (good for demo)
- Matches established patterns (Kotaemon, Perplexity)
- No extra clicks required to see sources

## Components

```
src/components/Sources/
├── SourcePanel.tsx        # Sidebar container
├── SourcePanel.module.css
├── SourceCard.tsx         # Individual source card
├── SourceCard.module.css
└── index.ts               # Barrel export
```

## State Management

### chatStore Updates

Add to existing `useChatStore`:

```typescript
interface ChatStore {
  // ... existing fields
  selectedSourceIndex: number | null;
  setSelectedSource: (index: number | null) => void;
}
```

**Rationale:** Keeps all chat-related state together. Simple, no new store needed.

## Component Details

### SourcePanel (Container)

- Gets sources from the **latest assistant message** in `chatStore.messages`
- Renders list of `<SourceCard>` components
- Empty state when no sources available
- Header: "Sources" with count badge

### SourceCard (Individual Source)

**Props:**
```typescript
interface SourceCardProps {
  source: Source;
  index: number;
  isSelected: boolean;
  onSelect: (index: number) => void;
}
```

**Display:**
- Document name (from `source.documentName`)
- Relevance score as visual indicator (bar or percentage)
- Excerpt: truncated to ~100 chars, expandable on click
- Highlighted border/background when `isSelected`

**Behavior:**
- Click card header → `onSelect(index)` to highlight
- Click excerpt area → toggle expand/collapse
- Smooth transition for expand animation

## Data Flow

```
User clicks [1] in chat message
    ↓
handleCitationClick(0) in ChatPanel
    ↓
setSelectedSource(0) in chatStore
    ↓
SourcePanel re-renders, SourceCard[0] shows highlighted state
```

## Styling

Uses existing CSS design tokens from `styles/index.css`:

| Element | Style |
|---------|-------|
| Panel | `--color-background-alt` bg, left border |
| Card | `--color-background` bg, `--radius-md`, `--shadow-sm` |
| Card selected | `--color-accent` border, subtle highlight bg |
| Score bar | `--color-primary` fill |
| Document name | `--color-text`, font-weight 500 |
| Excerpt | `--color-text-muted`, smaller font |

## App Layout Integration

Update `App.tsx` and `App.module.css` for side-by-side layout:

```tsx
<div className={styles.app}>
  <main className={styles.main}>
    <ChatPanel />
  </main>
  <aside className={styles.sidebar}>
    <SourcePanel />
  </aside>
</div>
```

```css
.app {
  display: flex;
  height: 100vh;
}

.main {
  flex: 1;
  min-width: 0;
}

.sidebar {
  width: 320px;
  border-left: 1px solid var(--color-border);
}
```

## Edge Cases

| Scenario | Handling |
|----------|----------|
| No assistant messages yet | Show empty state: "Sources will appear here" |
| Assistant message with no sources | Show: "No sources for this response" |
| Citation index out of bounds | Ignore click (defensive) |
| Tenant change | Sources clear with messages (existing behavior) |
| Very long excerpt | Truncate with "..." and expand button |

## Out of Scope (YAGNI)

- Document preview/PDF viewer
- Source search/filtering
- Copy citation button
- Source relevance threshold warnings
- Persist expanded state

## Acceptance Criteria

- [ ] SourcePanel displays in right sidebar
- [ ] Sources from latest assistant message shown
- [ ] SourceCard shows document name, score, truncated excerpt
- [ ] Click citation in chat highlights corresponding source
- [ ] Click source card expands/collapses excerpt
- [ ] Empty states handled gracefully
