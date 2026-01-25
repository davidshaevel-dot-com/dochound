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

### Setup

```bash
# Clone and install dependencies (monorepo - install at root)
git clone <repo-url>
cd dochound/main
npm install           # Installs all workspace dependencies

# Backend setup
cp packages/backend/.env.example packages/backend/.env
# Edit packages/backend/.env and add your OPENAI_API_KEY

npm run index:all     # Index all tenant corpora (one-time)
npm run dev           # Start all services

# Or run backend only:
cd packages/backend
npm run index:all     # Index all tenant corpora (one-time)
npm run dev           # Start backend on :3001
```

**Frontend setup** (once frontend package exists):
```bash
cd packages/frontend
npm run dev           # Start frontend on :5173
```

### Verify Backend

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{"status":"ok","timestamp":"...","tenantsReady":["manufacturing-demo","interview-prep"]}
```

### Environment Variables

**Backend (`packages/backend/.env`):**
```
OPENAI_API_KEY=sk-...
VECTOR_STORE=simple
PORT=3001
```

**Frontend (`packages/frontend/.env`):**
```
VITE_API_URL=http://localhost:3001
```

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
# List worktrees
git worktree list

# Create feature branch
git worktree add ../feature-name -b feature-name

# Remove worktree when done
git worktree remove ../feature-name
```

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
