# DocHound

"Sniff out answers from your technical documents"

A multi-tenant RAG-powered document intelligence platform.

## Overview

DocHound allows natural language queries across isolated document tenants:
- **Manufacturing tenant:** "What's the maintenance schedule for the hydraulic press?"
- **Interview prep tenant:** "How does Ella's permission model relate to Circuit's needs?"

The system synthesizes answers from tenant-specific documents with source citations, demonstrating multi-tenant isolation and RAG technology patterns.

## Tech Stack

- **Frontend:** React + TypeScript, React Query, Zustand, CSS Modules
- **Backend:** Node.js + Express + LlamaIndex.TS
- **Vector Store:** Pluggable (SimpleVectorStore default, ChromaDB optional)
- **LLM:** OpenAI GPT-4o-mini (pluggable for other providers)

## Quick Start

### Prerequisites
- Node.js 18+
- OpenAI API key

### 1. Clone the Repository

```bash
git clone <repo-url>
cd dochound/main
```

---

### 2. Backend Setup

```bash
cd packages/backend
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Verify tenant discovery
npm run verify:tenants

# Index document corpora (one-time setup)
npm run index:all

# Start the backend server
npm run dev
```

**Verify backend is running:**

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{"status":"ok","service":"dochound-backend","timestamp":"..."}
```

**Test a chat query:**

```bash
curl -X POST http://localhost:3001/api/tenants/interview-prep/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is Ella?"}'
```

---

### 3. Frontend Setup

Open a new terminal:

```bash
cd packages/frontend
npm install

# Start the frontend dev server
npm run dev
```

**Verify frontend is running:**

Open http://localhost:5173 in your browser. You should see the DocHound interface with a tenant selector.

---

### Environment Variables

**Backend (`packages/backend/.env`):**
```
OPENAI_API_KEY=sk-...
VECTOR_STORE=simple
PORT=3001
```

**Frontend (`packages/frontend/.env`):** *(optional)*
```
VITE_API_URL=http://localhost:3001
```

Note: The frontend proxies `/api` requests to the backend, so `VITE_API_URL` is only needed if running the backend on a non-default port.

## Repository Structure

This repo uses a **bare worktree pattern** for git, allowing multiple branches to be checked out simultaneously:

```
dochound/
├── .bare/             # Bare git repository
├── .git               # File pointing to .bare
└── main/              # Main branch worktree
    ├── docs/
    │   ├── plans/     # Project proposal and specs
    │   └── branding/  # Sherlock mascot photos
    ├── packages/
    │   ├── frontend/  # React + Vite
    │   └── backend/   # Express + LlamaIndex
    │       └── tenants/
    │           ├── manufacturing-demo/corpus/
    │           └── interview-prep/corpus/
    ├── CLAUDE.md      # Claude Code context
    └── README.md
```

### Working with Worktrees

```bash
# From main/ directory:

# List worktrees
git worktree list

# Create feature branch (creates sibling to main/)
git worktree add ../feature-name -b feature-name

# Remove worktree when done
git worktree remove ../feature-name
```

**Note:** Before removing a worktree, copy any gitignored files (`.env`, etc.) to `main/` as they won't be tracked by git. See `CLAUDE.md` for detailed worktree cleanup workflow.

## Architecture

DocHound uses a two-stage RAG pattern with forced function calling:

1. **Stage 1:** Force document retrieval (`tool_choice: "required"`)
2. **Stage 2:** Synthesize answer from retrieved documents (`tool_choice: "none"`)

This ensures every response is grounded in tenant documents - no hallucination.

### Multi-Tenancy

Each tenant has isolated:
- Document corpus (`./tenants/{id}/corpus/`)
- Vector index (`./tenants/{id}/index-data/`)
- Configuration (optional per-tenant settings)

API routes include tenant ID: `/api/tenants/:tenantId/chat`

### Pluggable Vector Store

```
VECTOR_STORE=simple   # Default: file-based, zero dependencies
VECTOR_STORE=chroma   # Optional: ChromaDB for production
```

## Pre-Configured Tenants

### manufacturing-demo
Sample technical documentation demonstrating document AI for manufacturing:
- Equipment manuals
- Safety procedures
- Maintenance schedules

### interview-prep
Personal knowledge base for interview preparation:
- Technical specifications (Ella RAG system)
- Company research (Circuit)
- Interview prep notes

## License

Private project for portfolio demonstration.
