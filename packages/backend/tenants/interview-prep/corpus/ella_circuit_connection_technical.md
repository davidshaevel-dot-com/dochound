# Ella → Circuit: Technical Depth

**Purpose:** Demonstrate deep RAG architecture knowledge from building Zello's Ella AI Assistant, and how it directly maps to Circuit's Document AI
**For Use In:** Technical discussions, follow-up interviews with CTO or engineering leads
**Last Updated:** January 24, 2026

---

## What I Built at Zello

At Zello, I worked on **Ella** - a production AI assistant that gives frontline workers instant, voice-based answers from their company's knowledge base. This is a RAG (Retrieval-Augmented Generation) system at its core.

### Architecture I Worked With

```
User Query (voice/text)
    │
    ▼
┌─────────────────────────────────┐
│  Socket Server (TCP :8086)      │  ← Custom binary protocol
│  One goroutine per connection   │
└─────────┬───────────────────────┘
          │
          ▼
┌─────────────────────────────────┐
│  Message Use Case               │
│  Token budgeting & context mgmt │  ← 1000 tokens history, 250 current
└─────────┬───────────────────────┘
          │
          ▼
┌─────────────────────────────────┐
│  OpenAI Client (Two-Stage)      │
│                                 │
│  Stage 1: Force tool calling    │  ← GPT-4.1-mini with tool=required
│  → retrieve_relevant_documents  │
│                                 │
│  Stage 2: Generate answer       │  ← Tool results + context → final answer
└─────────┬───────────────────────┘
          │
          ▼
┌─────────────────────────────────┐
│  Elasticsearch (ELSER-2)        │
│  Semantic search with sparse    │  ← Permission-filtered, network-isolated
│  embeddings on document chunks  │
└─────────────────────────────────┘
```

### Key Technical Components

**1. Two-Stage Function Calling Pattern**

The system uses OpenAI's function calling with forced tool use. Stage 1 always triggers document retrieval (tool_choice: "required"). Stage 2 synthesizes the retrieved documents into a concise answer (tool_choice: "none"). This ensures every response is grounded in the knowledge base.

**2. Elasticsearch with ELSER-2 Sparse Embeddings**

Documents are indexed with Elasticsearch's `semantic_text` field type, using the ELSER-2 model for sparse vector embeddings. This enables semantic search - users can ask questions in natural language, and the system finds relevant document chunks even without exact keyword matches.

Three indices power the system:
- `document-embeddings` - Chunked documents with semantic vectors
- `document-metadata` - Document status, ownership, permissions
- `document-sync` - S3 connector sync state management

**3. Permission-Scoped Document Access**

Every search query is filtered by:
- Network isolation (tenant-level separation)
- User-level permissions (`allowed_users`)
- Group-level permissions (`allowed_groups`)
- Feature flags (kiosk mode restricts to directly matching docs only)

**4. Document Sync Pipeline**

A background sync service polls the metadata index for pending documents, configures S3 connector filtering rules, and orchestrates batch embedding generation. Documents flow: S3 → Elasticsearch S3 connector → ELSER-2 embeddings → searchable index.

**5. Multi-Mode Prompt Engineering**

Three distinct system prompts for different contexts:
- **Default:** Frontline worker assistant - concise (1-3 sentences), knowledge-base grounded
- **Onboarding:** Trial users - strict, only answers from provided docs, deflects off-topic
- **Kiosk:** Retail mode - single-sentence answers, escalate when unsure

**6. Token Budget Management**

Careful allocation across the context window:
- Chat history: max 1,000 tokens (newest messages first)
- Current message: max 250 tokens
- Retrieved documents: max 2,500 tokens
- Simple tokenization heuristic for Go (punctuation→space, split on whitespace)

**7. Audio/Voice Pipeline**

Text-to-speech via OpenAI TTS-1 model with Opus codec, streamed as OGG/Opus packets over the socket connection. Graceful fallback from audio to text if TTS fails.

---

## Direct Technical Parallels to Circuit

| Ella (Zello) | Document AI (Circuit) |
|--------------|----------------------|
| Frontline workers querying knowledge base | Manufacturing workers querying technical docs |
| Elasticsearch ELSER-2 semantic search | Document ingestion + AI search (likely similar) |
| Permission-scoped document access | Partner/dealer/technician access control |
| Two-stage RAG (retrieve → generate) | Making documentation "searchable, understandable, useful" |
| Document sync from S3 | Ingesting PDFs, drawings, specs, manuals |
| Multi-mode prompts (default/kiosk/onboarding) | Different user contexts (sales/technician/partner) |
| Token budget management | Handling millions of pages of documentation |
| Chat session management (multi-turn) | Contextual follow-up questions about products |

### Specific Technical Bridges

**1. Document Ingestion at Scale**

At Zello, I worked with a pipeline that syncs documents from S3 into Elasticsearch for embedding generation. Circuit faces the same challenge at larger scale - ingesting millions of pages of manufacturing documentation (PDFs, drawings, specs). The patterns are the same: chunking strategies, embedding generation, metadata extraction, and sync state management.

**2. Semantic Search vs. Keyword Search**

Ella uses ELSER-2 sparse embeddings for semantic search. When a technician asks "how do I reset the conveyor belt," the system finds relevant documents even if they say "clearing the transport mechanism fault." Circuit's Document AI needs the same capability - a sales rep asking about "thermal ratings" needs to find documents about "operating temperature specifications."

**3. Permission Models for Multi-Tenant Access**

Ella filters documents by network, user, and group permissions. Circuit has an analogous challenge: a manufacturer's internal team sees everything, but dealer A should only see docs for products they sell, not dealer B's pricing. I've implemented this exact pattern.

**4. Context Window Management**

With LLMs, you can't dump millions of pages into a prompt. You need smart retrieval, chunking, and token budgeting. At Zello, we limit retrieved context to 2,500 tokens and conversation history to 1,000. Circuit faces the same constraint with much larger document sets.

**5. Prompt Engineering for Different User Types**

Ella has three prompt modes for different user contexts. Circuit likely needs similar specialization - a technician needs step-by-step instructions, a sales rep needs product comparisons, a support agent needs troubleshooting guides. Same pattern, different domains.

---

## What I Can Bring to Circuit

### Concrete Technical Knowledge

1. **Production RAG architecture** - Not theoretical, I've worked on a system handling real user queries
2. **Semantic search implementation** - Elasticsearch, embeddings, query construction with permission filters
3. **LLM integration patterns** - Function calling, tool use, two-stage completion
4. **Document pipeline engineering** - S3 sync, embedding generation, metadata management
5. **Token economics** - Practical experience budgeting context windows
6. **Multi-tenant isolation** - Permission-scoped search in shared infrastructure
7. **Observability** - Prometheus metrics for latency, token usage, search performance

### Technical Judgment

- **When to force tool calling vs. let the model decide** - We force document retrieval because hallucination on technical information is unacceptable
- **Chunking trade-offs** - Smaller chunks = more precise retrieval, larger chunks = more context per result
- **Embedding model selection** - ELSER-2 sparse embeddings vs. dense embeddings trade-offs
- **Prompt engineering rigor** - Different prompts for different user contexts isn't optional, it's critical
