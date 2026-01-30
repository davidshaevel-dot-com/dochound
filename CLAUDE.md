# DocHound - Claude Code Context

## Project Overview

**DocHound** - "Sniff out answers from your technical documents"

A multi-tenant RAG-powered document intelligence platform that demonstrates:
- **Proposal 1's** public-facing technical doc search appeal (good for portfolio)
- **Proposal 3's** personal knowledge base utility (useful for interview prep)
- **Ella's** multi-tenant architecture patterns (tenant isolation)
- **Pluggable** AI providers and vector stores (demonstrates architectural thinking)

**Mascot:** Sherlock the DocHound - a detective hound with deerstalker cap and magnifying glass, styled from actual photos of David's dog Sherlock.

**The meta-angle:** This tool can be demo'd *during* the interview, showing it answering questions about Circuit and your experience in real-time from the interview-prep tenant.

## Development Approach

Use the **superpowers skills** whenever they are relevant. This includes but is not limited to:
- `superpowers:brainstorming` - Before any creative work or feature implementation
- `superpowers:writing-plans` - When planning multi-step tasks
- `superpowers:test-driven-development` - When implementing features or bugfixes
- `superpowers:systematic-debugging` - When encountering bugs or unexpected behavior
- `superpowers:verification-before-completion` - Before claiming work is complete
- `superpowers:requesting-code-review` - When completing major features

If there's even a 1% chance a skill applies, invoke it.

## Commit Message Convention

All commits should include a `related-issues:` footer linking to the Linear issue:

```
feat(scope): short description

Longer description if needed.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
related-issues: DH-XXX
```

## Pull Request Convention

**Merge Strategy:** Always use **Squash and Merge** for pull requests.

- Keeps main branch history clean with one commit per feature/fix
- PR title becomes the commit message
- Individual commits are preserved in PR history for reference

```bash
# Merge PR with squash
gh pr merge <PR_NUMBER> --squash

# Delete the remote branch (--delete-branch doesn't work with worktrees)
git push origin --delete <branch-name>
```

## Interview Context

- **Target Company:** Circuit (Document AI for manufacturing)
- **Target Role:** Principal Frontend Engineer
- **Interviewer:** Jackie Padgett (CPO) - Tuesday, January 27, 2026
- **Timeline:** 2 days to build MVP

### Why DocHound for Circuit

| Circuit Need | DocHound Demonstrates |
|--------------|----------------------|
| Manufacturing document processing | Multi-tenant support for technical PDFs |
| AI-powered information retrieval | Two-stage RAG with forced function calling |
| React + TypeScript frontend | Circuit's exact stack (React Query, Zustand, CSS Modules) |
| Production-grade architecture | Multi-tenant isolation, pluggable AI providers |

## Tech Stack (Matching Circuit's Requirements)

### Frontend

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
| **LLM** | OpenAI GPT-4o-mini | Matches Ella stack, supports forced function calling |

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

### Pluggable AI Providers

| Phase | Provider | Model |
|-------|----------|-------|
| **MVP** | OpenAI | GPT-4o-mini |
| **Phase 2** | Anthropic | Claude 3.5 Sonnet |
| **Phase 3** | Google | Gemini Pro |

## RAG Architecture - Two-Stage Forced Function Calling

This uses the same two-stage forced function calling pattern built for Ella at Zello:

```
User Query
    │
    ▼
┌─────────────────────────────────────┐
│ Stage 1: Forced Document Retrieval  │
│ tool_choice: "required"             │
│ → retrieve_documents(query)         │
│ → Returns top 5 chunks from tenant  │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Stage 2: Grounded Synthesis         │
│ tool_choice: "none"                 │
│ → Generate answer from retrieved    │
│   documents, with source citations  │
└─────────────────────────────────────┘
```

**Key insight:** Forcing document retrieval (tool_choice: "required") prevents hallucination. The LLM cannot answer from its training data - it must cite retrieved documents.

### Chunking Strategy

- **Chunk size:** 1024 tokens
- **Overlap:** 20 tokens
- **Rationale:** Balances context preservation with retrieval precision

## Multi-Tenancy Architecture

DocHound uses a **tenant ID** to partition data, inspired by Ella's network-based isolation:

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

## Repository Structure (Bare Worktree Pattern)

This repo uses a bare repository with git worktrees, allowing multiple branches to be checked out simultaneously:

```
dochound/
├── .bare/                             # Bare git repository
├── .git                               # File pointing to .bare
└── main/                              # Main branch worktree
    ├── docs/
    │   ├── plans/
    │   │   └── 2026-01-25-project-proposal-4-dochound.md
    │   └── branding/                  # Sherlock photos for mascot
    ├── packages/
    │   ├── frontend/                  # React + Vite
    │   │   ├── src/
    │   │   │   ├── components/
    │   │   │   │   ├── Chat/
    │   │   │   │   ├── Sources/
    │   │   │   │   ├── Tenant/
    │   │   │   │   └── Layout/
    │   │   │   ├── hooks/
    │   │   │   ├── stores/
    │   │   │   └── styles/
    │   │   ├── package.json
    │   │   └── vite.config.ts
    │   └── backend/                   # Express + LlamaIndex
    │       ├── src/
    │       │   ├── providers/         # Pluggable AI + vector store
    │       │   ├── tenants/           # Tenant management
    │       │   └── rag/               # Two-stage RAG pipeline
    │       ├── tenants/               # Per-tenant corpus + index
    │       │   ├── manufacturing-demo/
    │       │   │   └── corpus/        # Sample PDFs
    │       │   └── interview-prep/
    │       │       └── corpus/        # Interview prep markdown
    │       └── package.json
    ├── package.json                   # Workspace root
    ├── turbo.json                     # Turborepo config
    ├── CLAUDE.md                      # This file
    └── README.md
```

### Working with Worktrees

```bash
# List all worktrees (run from dochound/ or dochound/main/)
git worktree list

# Create a new feature branch worktree
cd /Users/dshaevel/workspace-ds/dochound
git worktree add feature-branch -b feature-branch

# Remove a worktree when done
git worktree remove feature-branch
```

### Worktree Cleanup - IMPORTANT

**Before removing a worktree**, copy any gitignored files you need to the main worktree. These files are NOT tracked by git and will be lost when the worktree is deleted.

```bash
# Example: After merging a PR, before deleting the worktree
# Copy .env files and other gitignored config from the feature worktree to main

# From the feature worktree directory:
cp packages/backend/.env ../main/packages/backend/.env
cp packages/frontend/.env ../main/packages/frontend/.env  # if it exists

# Or from the dochound root:
cp <worktree-name>/packages/backend/.env main/packages/backend/.env
```

**Common gitignored files to copy:**
- `packages/backend/.env` - API keys, environment config
- `packages/frontend/.env` - Frontend environment config
- `**/index-data/` - Vector store indexes (can be regenerated with `npm run index:all`)

**Workflow:**
1. Merge PR: `gh pr merge <PR_NUMBER> --squash`
2. Pull changes into main worktree: `cd main && git pull`
3. Delete remote branch: `git push origin --delete <branch-name>`
4. Copy gitignored files from feature worktree to main
5. Remove the worktree: `git worktree remove <worktree-name>`

## Local Development Setup

```bash
# Terminal 1: Backend
cd packages/backend
npm install
npm run verify:tenants  # Verify tenant discovery works
npm run index:all       # One-time: index all tenant corpora
npm run dev             # Starts Express on :3001

# Terminal 2: Frontend
cd packages/frontend
npm install
npm run dev          # Starts Vite on :5173
```

## Environment Variables

```bash
# packages/backend/.env
OPENAI_API_KEY=sk-...
VECTOR_STORE=simple          # or "chroma" for production mode
PORT=3001

# packages/frontend/.env
VITE_API_URL=http://localhost:3001
```

## Pre-Configured Tenants

### manufacturing-demo
Sample PDFs demonstrating Circuit's domain:
- Technical equipment manuals
- Safety procedures
- Maintenance schedules

### interview-prep
Interview preparation documents (pre-loaded from PrepBot corpus):
- `ella_technical_spec.md` - Deep technical detail on the Ella RAG system
- `ella_circuit_connection_balanced.md` - Balanced Ella ↔ Circuit mapping for Jackie
- `ella_circuit_connection_technical.md` - Technical parallels for engineering interviews
- `ella_circuit_connection_product.md` - Product thinking parallels
- `circuit_company_background.md` - Circuit research and context
- `interview_prep_jackie_padgett.md` - Jackie-specific interview prep
- `circuit_principal_frontend_engineer.txt` - Job description
- Resume files

## Linear Project

- **Project:** DocHound - Multi-Tenant Document Intelligence
- **URL:** https://linear.app/davidshaevel-dot-com/project/dochound-multi-tenant-document-intelligence-85c346ead335
- **ID:** 2166bcc6-2f60-4983-ab8a-f9ecb1cf0374

## Implementation Priority

### MVP Features (Interview Demo)

1. **Backend Foundation**
   - Express server with tenant routing
   - Pluggable vector store (SimpleVectorStore default)
   - Two-stage RAG pipeline with forced function calling
   - Index script for both tenants

2. **Frontend Foundation**
   - React + Vite setup with Circuit's stack
   - Chat interface with streaming responses
   - Source citations with expandable excerpts
   - Tenant switcher dropdown

3. **Demo Readiness**
   - Pre-indexed tenants
   - DocHound branding with Sherlock mascot
   - Tested queries for both tenants

### Success Criteria

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

## Demo Strategy

Since this is designed to be demo'd during the interview:

1. **Pre-index before demo** - Run `npm run index:all` before the interview
2. **Test the night before** - Verify all queries work with both tenants
3. **Have backup** - Keep a screen recording of the demo in case of issues
4. **Battery + WiFi** - Ensure laptop is charged; have phone hotspot as backup

### The Meta Angle

During the interview with Jackie:
1. Show Tenant A (manufacturing-demo) processing technical documents (their domain)
2. Switch to Tenant B (interview-prep) and ask DocHound about Circuit
3. Explain: "This is the exact pattern I'd bring to your document AI platform"

## Code Review Process

**Core principle:** Verify before implementing. Ask before assuming. Technical correctness over social comfort.

---

### Performing Reviews

#### Pre-Review Checklist

Before reviewing any PR:

- [ ] Read linked Linear issue for full context
- [ ] Understand the scope (what SHOULD change vs what DID change)
- [ ] Check if PR builds successfully
- [ ] Note any dependencies on other PRs/branches

#### Review Steps

| Step | Focus |
|------|-------|
| 1. **Context** | Read PR description, linked issues, design docs |
| 2. **Architecture** | Does the solution fit codebase patterns? |
| 3. **File-by-file** | Read each changed file, check for issues |
| 4. **Functional** | Does it work? Run tests/build |
| 5. **Edge Cases** | What could break? Missing error handling? |
| 6. **Security/Perf** | Any obvious concerns? |
| 7. **Consistency** | Naming, formatting, patterns match codebase |

#### Severity Classification

Classify each feedback item:

- 🔴 **Blocker** - Must fix before merge
- 🟡 **Suggestion** - Would improve but not required
- 🟢 **Nit** - Style/preference, take it or leave it

This helps authors prioritize and reduces back-and-forth on minor items.

#### "What I Checked" Summary

After reviewing, state what you verified:

```markdown
Reviewed:
- [x] TypeScript types correct
- [x] Build passes
- [x] Follows existing patterns
- [ ] Did not test manually (backend not running)
```

This sets expectations about review depth.

#### Neutral Positive Observations

Note what works well without being performative:
- ✅ "The error handling pattern here is consistent with the rest of the codebase"
- ✅ "This matches the approach used in [other file]"
- ❌ "Great job on this!"
- ❌ "Love this approach!"

---

### Receiving Reviews

#### Response Pattern

When receiving code review feedback (e.g., from gemini-code-assist):

1. **READ** - Complete feedback without reacting
2. **UNDERSTAND** - Restate requirement in own words (or ask if unclear)
3. **VERIFY** - Check against codebase reality
4. **EVALUATE** - Technically sound for THIS codebase?
5. **RESPOND** - Technical acknowledgment or reasoned pushback
6. **IMPLEMENT** - One item at a time, test each

#### Handling Unclear Feedback

**If ANY item is unclear → STOP.** Do not implement anything yet. Ask for clarification on ALL unclear items before proceeding. Items may be related, and partial understanding leads to wrong implementation.

#### When to Push Back

Push back when:
- Suggestion breaks existing functionality
- Reviewer lacks full context
- Violates YAGNI (unused feature)
- Technically incorrect for this stack
- Conflicts with architectural decisions

Use technical reasoning, not defensiveness. Reference working tests/code.

#### Forbidden Responses

Never use performative agreement:
- ❌ "You're absolutely right!"
- ❌ "Great point!" / "Excellent feedback!"
- ❌ "Thanks for catching that!"

Instead, state the technical fix or pushback reasoning directly.

#### Proper Acknowledgment

When feedback IS correct:
- ✅ "Fixed. [Brief description of what changed]"
- ✅ "Good catch - [specific issue]. Fixed in [location]."
- ✅ Just fix it and show in the code

---

### Workflow Steps

#### 1. Fetch Comments

```bash
gh api repos/davidshaevel-dot-com/dochound/pulls/<PR_NUMBER>/comments
```

#### 2. Evaluate Each Comment

For each piece of feedback:
- **AGREE:** Make the fix after verifying it doesn't break anything
- **PARTIALLY AGREE:** Make the fix but note context
- **DISAGREE:** Provide detailed technical explanation why
- **UNCLEAR:** Ask for clarification before implementing

#### 3. Make Fixes and Commit

```bash
git add <specific-files>
git commit -m "fix: address code review feedback from <reviewer>

- Fixed X (valid concern about Y)
- Fixed Z (improves W)
- Declined A (breaks B / YAGNI / reason)

related-issues: TT-XXX

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
git push
```

#### 4. Reply to Review Comments

Reply **in the comment thread** (not top-level):

**IMPORTANT: Always start with `@gemini-code-assist` so they are notified of your response.**

```bash
gh api repos/davidshaevel-dot-com/dochound/pulls/<PR>/comments/<COMMENT_ID>/replies \
  -f body="@gemini-code-assist Fixed. Changed X to Y."
```

Every inline reply must include:
- **`@gemini-code-assist` at the start** (required for notification)
- What was fixed and how
- Technical reasoning if declining

#### 5. Post Summary Comment

Add a summary comment to the PR:

**IMPORTANT: Always start with `@gemini-code-assist` so they are notified.**

```markdown
@gemini-code-assist Review addressed:

| # | Feedback | Resolution |
|---|----------|------------|
| 1 | Issue X | Fixed in abc123 - Added validation for edge case |
| 2 | Issue Y | Fixed in abc123 - Refactored to use recommended pattern |
| 3 | Issue Z | Declined - YAGNI, feature not currently used |

Thanks for the review!
```

**Resolution column format:** Include both the commit reference AND a brief summary of how the feedback was addressed. This helps reviewers quickly understand what changed without needing to inspect each commit.

## Related Resources

- **Original proposal:** [docs/plans/2026-01-25-project-proposal-4-dochound.md](docs/plans/2026-01-25-project-proposal-4-dochound.md)
- **PrepBot backend (reference implementation):** ~/workspace-ds/prepbot/main/packages/backend
- **Ella technical spec:** packages/backend/tenants/interview-prep/corpus/ella_technical_spec.md
- **Job description:** packages/backend/tenants/interview-prep/corpus/circuit_principal_frontend_engineer.txt
