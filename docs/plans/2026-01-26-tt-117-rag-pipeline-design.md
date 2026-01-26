# TT-117: Two-Stage RAG Pipeline Design

**Date:** January 26, 2026
**Issue:** [TT-117](https://linear.app/davidshaevel-dot-com/issue/TT-117/implement-two-stage-rag-pipeline-with-forced-function-calling)

---

## Overview

Implement the Ella-inspired two-stage RAG pipeline with forced function calling. This pattern ensures every response is grounded in retrieved documents (no hallucination).

## Design Decisions

### OpenAI SDK Approach

**Choice:** Direct OpenAI SDK with `tool_choice` parameter

**Rationale:**
- Full control over two-stage forced function calling pattern
- Simpler than LlamaIndex ChatEngine for this specific use case
- LLM calls isolated to `rag.service.ts` for future provider abstraction

### Model Configuration

**Choice:** Environment variable `OPENAI_MODEL`

```bash
OPENAI_MODEL=gpt-4o-mini  # Default, can override to gpt-4o
```

---

## Architecture & Data Flow

```
User Query: "What's the maintenance schedule for the hydraulic press?"
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│                    RAGService.chat()                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Stage 1: Forced Retrieval                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ OpenAI API call with tool_choice: "required"        │   │
│  │ → Forces LLM to call retrieve_documents(query)      │   │
│  │ → VectorStore.query() returns top 5 chunks          │   │
│  │ → Returns: NodeWithScore[] with text + metadata     │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  Stage 2: Grounded Synthesis                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ OpenAI API call with tool_choice: "none"            │   │
│  │ → System prompt: "Answer ONLY from these documents" │   │
│  │ → User message includes retrieved chunks            │   │
│  │ → Response has inline citations [1], [2]            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
Response: { answer: "The maintenance schedule...[1]", sources: [...] }
```

**Key insight:** Stage 1 forces retrieval (no hallucination). Stage 2 prevents additional tool calls, ensuring the answer is grounded only in retrieved documents.

---

## Interfaces & Types

```typescript
// rag.service.ts - Input/Output types

/** Request to the RAG service */
interface ChatRequest {
  tenantId: string;
  message: string;
  conversationHistory?: ChatMessage[];  // Optional for multi-turn
}

/** Individual chat message */
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Source document returned with response */
interface Source {
  id: string;           // Unique identifier for the chunk
  filename: string;     // Original document filename
  text: string;         // Chunk text (for UI expansion)
  score: number;        // Relevance score (0-1)
}

/** Response from the RAG service */
interface ChatResponse {
  answer: string;       // Answer with inline citations [1], [2]
  sources: Source[];    // Source metadata for frontend display
}
```

---

## Retrieval Tool Definition

```typescript
// retrieval.tool.ts - OpenAI function definition

export const retrieveDocumentsTool = {
  type: 'function' as const,
  function: {
    name: 'retrieve_documents',
    description: 'Search the document corpus for relevant information.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query to find relevant documents',
        },
      },
      required: ['query'],
    },
  },
};
```

---

## System Prompts

```typescript
// prompts.ts

export const STAGE1_SYSTEM_PROMPT = `You are a document retrieval assistant.
When the user asks a question, you MUST call the retrieve_documents function to search for relevant information.
Do not attempt to answer from your own knowledge.`;

export const STAGE2_SYSTEM_PROMPT = `You are a helpful assistant that answers questions based ONLY on the provided documents.

Rules:
1. ONLY use information from the retrieved documents below
2. Include inline citations like [1], [2] referring to source numbers
3. If the documents don't contain the answer, say "I couldn't find information about that in the available documents."
4. Be concise and direct

Retrieved Documents:
{{documents}}`;
```

---

## File Structure

```
src/rag/
├── rag.service.ts      # Main RAGService class with chat() method
├── retrieval.tool.ts   # OpenAI tool definition + executeRetrieval()
├── prompts.ts          # System prompts for both stages
├── types.ts            # ChatRequest, ChatResponse, Source interfaces
└── index.ts            # Re-exports
```

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Invalid tenant | Throw error (caller handles 404) |
| Missing tool call | Log full response, throw error (unexpected API issue) |
| No search results | Continue to Stage 2 (LLM says "couldn't find info") |
| OpenAI API errors | Let bubble up (caller handles 500) |

---

## Environment Variables

Add to `.env.example`:

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini    # Options: gpt-4o-mini, gpt-4o, gpt-4-turbo
```

---

## Acceptance Criteria

- [ ] LLM always retrieves documents before answering (no hallucination)
- [ ] Responses include inline citations [1], [2]
- [ ] Source metadata returned with response for frontend display
- [ ] Model configurable via OPENAI_MODEL env var
