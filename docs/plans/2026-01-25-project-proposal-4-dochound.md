# Project Proposal 4: DocHound - Multi-Tenant Document Intelligence

**Date:** January 25, 2026
**Target Interview:** Jackie Padgett (CPO), Circuit - Tuesday, January 27, 2026
**Timeline:** 2 days to build MVP

---

## Overview

**DocHound** - "Sniff out answers from your technical documents"

A multi-tenant RAG-powered document intelligence platform that combines:
- **Proposal 1's** public-facing technical doc search appeal
- **Proposal 3's** personal knowledge base utility
- **Ella's** multi-tenant architecture patterns
- **Pluggable** AI providers and vector stores

### Branding Concept

**Mascot:** Sherlock the DocHound - a detective hound with deerstalker cap and magnifying glass, styled from actual photos of David's dog Sherlock.

**Branding Asset Capture Plan:**
1. Photo session with Sherlock in detective-themed props
2. Multiple poses: sniffing documents, magnifying glass, alert/searching
3. Use photos as base for logo, favicon, loading animations
4. Professional yet playful - memorable portfolio piece

---

## Interview Relevance

### Why This Project for Circuit

DocHound demonstrates the exact capabilities Circuit needs for their Document AI platform:

| Circuit Need | DocHound Demonstrates |
|--------------|----------------------|
| Manufacturing document processing | Multi-tenant support for technical PDFs |
| AI-powered information retrieval | Two-stage RAG with forced function calling |
| React + TypeScript frontend | Circuit's exact stack (React Query, Zustand, CSS Modules) |
| Production-grade architecture | Multi-tenant isolation, pluggable AI providers |

### Two Use Cases, One Platform

**Tenant A: Technical Documentation (Public Portfolio)**
- Upload: Manufacturing equipment PDFs, technical specifications
- Queries: "What's the maintenance schedule for the hydraulic press?" "Safety procedures for the CNC router?"
- Value: Demonstrates Circuit's core use case—manufacturing document intelligence

**Tenant B: Interview Prep Knowledge Base (Personal Utility)**
- Upload: Markdown interview prep docs, resume files, company research
- Queries: "How does Ella's permission model relate to Circuit's needs?" "What should I emphasize about my AI experience with Jackie?"
- Value: Actually useful for interview preparation; can demo live during interview

### The Meta Angle

During the interview with Jackie, you can:
1. Show Tenant A processing manufacturing documents (their domain)
2. Ask DocHound a question about Circuit—watch it answer in real-time
3. Explain: "This is the exact pattern I'd bring to your document AI platform"

---

## Tech Stack

### Frontend (Matching Circuit's Requirements)

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Framework** | React + TypeScript | Circuit's required stack |
| **Server State** | React Query | Circuit's stated preference |
| **Client State** | Zustand | Circuit's stated preference |
| **Styling** | CSS Modules | Circuit's stated preference |
| **Build** | Vite | Fast dev experience |

### Backend

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Runtime** | Node.js + Express | TypeScript throughout |
| **RAG Framework** | LlamaIndex.TS | Proven in PrepBot (TT-107) |
| **Vector Store** | **Pluggable** (see below) | Demonstrates architectural thinking |
| **Document Parsing** | LlamaIndex readers + pdf-parse | PDF and markdown support |

### Pluggable Vector Store Architecture

```
VectorStoreProvider (interface)
├── SimpleVectorStoreProvider (default)
│   - File-based persistence
│   - Zero dependencies
│   - "Clone and run" experience
└── ChromaDBProvider (optional)
    - Production-grade vector DB
    - In-process mode (no Docker)
    - Set VECTOR_STORE=chroma to enable
```

**Default:** SimpleVectorStore for frictionless setup
**Production mode:** `VECTOR_STORE=chroma` enables ChromaDB

### AI Providers (Pluggable)

| Phase | Provider | Model |
|-------|----------|-------|
| **MVP** | OpenAI | GPT-4o-mini |
| **Phase 2** | Anthropic | Claude 3.5 Sonnet |
| **Phase 3** | Google | Gemini Pro |

### Infrastructure

| Concern | Local | Cloud (Optional) |
|---------|-------|------------------|
| **Frontend** | Vite dev server (:5173) | Vercel |
| **Backend** | Express (:3001) | Railway |
| **Vector Storage** | File-based (SimpleVectorStore) | Railway volume |

---

## Multi-Tenancy Architecture

### Tenant Isolation Model (Inspired by Ella)

Like Ella's network-based isolation, DocHound uses a **tenant ID** to partition data:

```
┌─────────────────────────────────────────────────────────────┐
│                     DocHound Backend                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Tenant: "manufacturing-demo"     Tenant: "interview-prep"  │
│  ┌─────────────────────────┐     ┌─────────────────────────┐│
│  │ Documents:              │     │ Documents:              ││
│  │ - hydraulic_press.pdf   │     │ - ella_technical_spec.md││
│  │ - cnc_safety_manual.pdf │     │ - circuit_research.md   ││
│  │                         │     │ - interview_prep.md     ││
│  │ Vector Index:           │     │ Vector Index:           ││
│  │ ./tenants/mfg/index     │     │ ./tenants/prep/index    ││
│  └─────────────────────────┘     └─────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Concern | Approach | Rationale |
|---------|----------|-----------|
| **Index Isolation** | Separate vector store per tenant | No cross-tenant data leakage |
| **Tenant Selection** | URL path (`/api/tenants/:id/chat`) | Simple, explicit routing |
| **Document Storage** | Filesystem: `./tenants/{id}/corpus/` | Easy to inspect, debug |
| **Configuration** | Per-tenant config file | Different chunking, models per tenant |

### MVP Scope

For the interview demo, pre-configure two tenants:
1. **`manufacturing-demo`** - Sample PDFs (public technical docs)
2. **`interview-prep`** - Your interview prep markdown files

No runtime tenant creation needed for MVP—just demonstrate the isolation pattern.

---

## RAG Pipeline (Two-Stage Forced Function Calling)

### The Ella Pattern

This is the same pattern I built for Ella at Zello—forcing document retrieval prevents hallucination:

```
User Query: "What's the maintenance schedule for the hydraulic press?"
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ Stage 1: Forced Document Retrieval                          │
│ tool_choice: "required"                                     │
│                                                             │
│ LLM MUST call: retrieve_documents(query)                    │
│ → Returns: Top 5 chunks from tenant's vector index          │
│ → Includes: source document, chunk text, relevance score    │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ Stage 2: Grounded Synthesis                                 │
│ tool_choice: "none"                                         │
│                                                             │
│ System prompt: "Answer ONLY from the retrieved documents.   │
│ If the documents don't contain the answer, say so."         │
│                                                             │
│ → Generates answer with inline citations                    │
│ → Returns source metadata for UI display                    │
└─────────────────────────────────────────────────────────────┘
```

### Why This Matters

| Without Forced Retrieval | With Forced Retrieval |
|--------------------------|----------------------|
| LLM might answer from training data | LLM **must** cite retrieved docs |
| Hallucination risk | Grounded responses only |
| No source attribution | Every answer has citations |
| "I think..." responses | "According to [document]..." |

### Chunking Strategy (From PrepBot Learnings)

- **Chunk size:** 1024 tokens
- **Overlap:** 20 tokens
- **Rationale:** Balances context preservation with retrieval precision

---

## Frontend Architecture

### Component Structure

```
src/
├── components/
│   ├── Chat/
│   │   ├── ChatPanel.tsx          # Main chat container
│   │   ├── MessageList.tsx        # Message history
│   │   ├── MessageInput.tsx       # Query input with submit
│   │   └── Message.tsx            # Single message (user/assistant)
│   ├── Sources/
│   │   ├── SourcePanel.tsx        # Sources sidebar
│   │   ├── SourceCard.tsx         # Individual source citation
│   │   └── DocumentViewer.tsx     # Full document modal
│   ├── Tenant/
│   │   ├── TenantSelector.tsx     # Dropdown to switch tenants
│   │   └── TenantBadge.tsx        # Current tenant indicator
│   └── Layout/
│       ├── AppShell.tsx           # Main layout wrapper
│       └── Header.tsx             # DocHound branding + tenant selector
├── hooks/
│   ├── useChat.ts                 # React Query mutation for chat
│   ├── useTenants.ts              # React Query for tenant list
│   └── useDocuments.ts            # React Query for document list
├── stores/
│   └── chatStore.ts               # Zustand: conversation state, selected tenant
└── styles/
    └── *.module.css               # CSS Modules per component
```

### State Management Split

| Concern | Tool | Rationale |
|---------|------|-----------|
| **Server state** (chat responses, tenants, docs) | React Query | Caching, refetching, loading states |
| **Client state** (selected tenant, UI state) | Zustand | Simple, no boilerplate |

### Key UI Features

- **Streaming responses** - Show answer as it's generated
- **Inline citations** - Clickable `[1]` markers that highlight source
- **Source panel** - Expandable excerpts, link to full document
- **Tenant switcher** - Quick toggle between demo tenants

---

## Monorepo Structure

```
dochound/
├── .bare/                          # Bare git repository
├── .git                            # File pointing to .bare
├── main/                           # Main branch worktree
│   ├── docs/
│   │   ├── plans/                  # This proposal and future specs
│   │   └── branding/               # Sherlock photos for mascot
│   ├── packages/
│   │   ├── frontend/               # React + Vite
│   │   │   ├── src/
│   │   │   ├── package.json
│   │   │   └── vite.config.ts
│   │   └── backend/                # Express + LlamaIndex
│   │       ├── src/
│   │       │   ├── providers/      # Pluggable AI + vector store
│   │       │   ├── tenants/        # Tenant management
│   │       │   └── rag/            # Two-stage RAG pipeline
│   │       ├── tenants/            # Per-tenant corpus + index
│   │       │   ├── manufacturing-demo/
│   │       │   └── interview-prep/
│   │       └── package.json
│   ├── package.json                # Workspace root
│   ├── turbo.json                  # Turborepo config
│   ├── CLAUDE.md                   # Claude Code context
│   └── README.md
```

---

## Local Development Setup

```bash
# Clone and install
git clone <repo-url>
cd dochound
npm install

# Backend setup
cp packages/backend/.env.example packages/backend/.env
# Edit .env and add OPENAI_API_KEY

# Index both tenants
npm run index:all

# Start development
npm run dev
```

### Environment Variables

```bash
# packages/backend/.env
OPENAI_API_KEY=sk-...
VECTOR_STORE=simple          # or "chroma" for production mode
PORT=3001

# packages/frontend/.env
VITE_API_URL=http://localhost:3001
```

---

## Success Criteria

### MVP (Interview Demo)

- [ ] Two pre-configured tenants working (manufacturing-demo, interview-prep)
- [ ] Chat interface with streaming responses
- [ ] Source citations with expandable excerpts
- [ ] Tenant switcher in UI
- [ ] Two-stage RAG with forced function calling
- [ ] SimpleVectorStore default, ChromaDB optional
- [ ] Can demo live during interview
- [ ] DocHound branding with Sherlock mascot photos

### Stretch Goals (Post-MVP)

- [ ] PDF upload for manufacturing tenant
- [ ] Anthropic provider support
- [ ] Document management UI

---

## Sample Queries & Expected Behavior

### Manufacturing Tenant

| Query | Expected Response |
|-------|-------------------|
| "What's the maintenance schedule for the hydraulic press?" | Cites from hydraulic_press.pdf maintenance section |
| "Safety procedures for CNC operations?" | Synthesizes from safety manual documents |

### Interview Prep Tenant

| Query | Expected Response |
|-------|-------------------|
| "How does Ella's permission model work?" | Summarizes from ella_technical_spec.md |
| "How does this relate to Circuit?" | Synthesizes from ella_circuit_connection_*.md files |
| "What should I tell Jackie about my AI experience?" | Draws from interview_prep_jackie_padgett.md |

---

## Related Resources

- **Proposal 1 (Technical Doc Search):** [2026-01-25-project-proposal-1-technical-doc-search.md](2026-01-25-project-proposal-1-technical-doc-search.md)
- **Proposal 3 (Interview Prep KB):** [2026-01-25-project-proposal-3-interview-prep-kb.md](2026-01-25-project-proposal-3-interview-prep-kb.md)
- **PrepBot Backend (TT-107):** ~/workspace-ds/prepbot/main/packages/backend
- **Ella Technical Spec:** ~/workspace-ds/job-searches-2026-q1/main/docs/interview-prep/ella_technical_spec.md
