# TT-121: Chat Components Design

**Date:** January 26, 2026
**Issue:** [TT-121](https://linear.app/davidshaevel-dot-com/issue/TT-121)
**Status:** Approved

## Overview

Build the core chat interface components for DocHound. These components enable users to send questions and receive AI-generated answers with source citations.

## Components

```
src/components/Chat/
├── ChatPanel.tsx           # Main container
├── ChatPanel.module.css
├── MessageList.tsx         # Scrollable message area
├── Message.tsx             # Single message bubble
├── Message.module.css
├── MessageInput.tsx        # Input form
├── MessageInput.module.css
└── index.ts                # Barrel export
```

## State Management

### Chat Store (Zustand)

New `useChatStore` manages conversation state:

```typescript
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
```

**Rationale:** Zustand for UI state (messages), React Query for API calls (existing `useChat` hook). This matches Circuit's stack and keeps concerns separated.

## Component Details

### ChatPanel (Container)

- Renders MessageList + MessageInput
- Wires `useChat` hook with `tenantId` from `useTenantStore`
- Handles submit flow:
  1. Add user message to store
  2. Trigger mutation
  3. On success: add assistant message
  4. On error: set error state
- Full height flex column layout

### MessageList (Scroll Container)

- Maps `messages` from store to `<Message>` components
- Auto-scrolls to bottom on new messages (useEffect + ref)
- Shows loading indicator when `isLoading` is true
- Empty state: "Ask a question to get started"

### Message (Single Message)

- Props: `message: ChatMessage`
- User messages: right-aligned, primary color background, white text
- Assistant messages: left-aligned, light background
- Parses `[1]`, `[2]` patterns as clickable citation links
- Citation click: will scroll Sources panel (TT-122 integration)

### MessageInput (Form)

- Controlled textarea with submit button
- Disabled when `isLoading` is true
- Submit on Enter (Shift+Enter for newline)
- Clears input after successful submit
- Displays error message from store

## Styling

Uses existing CSS design tokens from `styles/index.css`:

| Element | Style |
|---------|-------|
| User message | `--color-primary` bg, white text, `--radius-lg` |
| Assistant message | `--color-background-alt` bg, `--color-text`, `--radius-lg` |
| Citations | `--color-accent` text, underline hover |
| Input area | Bottom-fixed, `--shadow-md` top |
| Send button | `--color-primary` bg, disabled grayed |

**Note:** Branding polish deferred to TT-124 (Layout components).

## Data Flow

```
User types → Submit
    ↓
addUserMessage() → message appears instantly
    ↓
useChat.mutate() → setLoading(true)
    ↓
[API call]
    ↓
Success: addAssistantMessage() → setLoading(false)
Error: setError() → show error, re-enable input
```

## Error Handling

| Scenario | Handling |
|----------|----------|
| API error | Display below input, keep user message, allow retry |
| Network failure | Same - "Failed to send. Please try again." |
| Empty input | Prevent submit (button disabled) |
| Tenant changes | Clear messages via `clearMessages()` |

## Edge Cases

- Rapid submit: input disabled during loading
- No sources: render message without citations
- Citation mismatch: render as plain text (defensive)

## Out of Scope (YAGNI)

- Dark mode
- Message timestamps
- Avatars
- Typing indicators (beyond basic loading)
- Message editing/deletion
- Conversation persistence (localStorage)
- Retry with backoff
- Rate limiting UI

## Acceptance Criteria

- [ ] Can type and send messages
- [ ] Messages render with user/assistant styling
- [ ] Citations `[1]`, `[2]` are clickable
- [ ] Loading state works correctly
- [ ] Error state displays and allows retry
- [ ] Messages clear on tenant change
