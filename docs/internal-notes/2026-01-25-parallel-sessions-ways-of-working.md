# Parallel Sessions: Ways of Working

**Date:** January 25, 2026
**Project:** DocHound
**Deadline:** EOD Monday, January 26, 2026

---

## Overview

We're running two Claude Code sessions in parallel to accelerate development:

| Session | Focus | Issues |
|---------|-------|--------|
| **Session A (this one)** | Backend implementation | TT-115, 116, 117, 118, 119 |
| **Session B (new)** | Frontend implementation | TT-120, 121, 122, 123, 124, 125 |

Both sessions converge for **TT-126: E2E Integration & Demo Prep**.

---

## Git Strategy

### Worktree Structure

```
dochound/
├── .bare/                    # Shared bare repository
├── main/                     # Main branch (merge target)
├── tt-115-vector-store/      # Session A: Backend worktree
└── tt-120-frontend-setup/    # Session B: Frontend worktree
```

### Rules

1. **Each session uses its own worktree** - Never work in the same worktree from two sessions
2. **Merge to main frequently** - Don't let branches diverge too far
3. **Pull main before starting new work** - Each worktree should rebase on latest main
4. **Squash and merge** - Keep main history clean

---

## Coordination Points

### Sync Points (Pause and Coordinate)

| After | Action |
|-------|--------|
| TT-115 + TT-116 merged | Frontend can define API client types |
| TT-119 merged (API endpoints) | Frontend can switch from mocks to real API |
| All backend merged | Begin TT-126 integration testing |

### Shared Files to Watch

These files may be touched by both sessions - coordinate before editing:

| File | Owner | Other Session Should |
|------|-------|---------------------|
| `CLAUDE.md` | Either (coordinate) | Pull before editing |
| `package.json` (root) | Backend first | Wait for backend to create |
| `.gitignore` | Either | Pull before editing |
| `docs/internal-notes/*` | Either | No conflicts expected |

---

## Starting Session B (Frontend)

### Step 1: Open New Terminal/Window

```bash
cd /Users/dshaevel/workspace-ds/dochound
```

### Step 2: Start Claude Code

```bash
claude
```

### Step 3: Provide Context

Copy this prompt to Session B:

```
This is the DocHound project - a multi-tenant RAG document intelligence platform.

I'm running parallel sessions:
- Session A (backend): Currently implementing TT-115 through TT-119
- Session B (this one): Frontend implementation TT-120 through TT-125

Read CLAUDE.md and docs/internal-notes/2026-01-25-parallel-sessions-ways-of-working.md for context.

Let's start with TT-120: Frontend project setup. Create a new git worktree for this work.
```

---

## Merge Order

### Recommended Sequence

```
1. Backend TT-115 (vector store) → merge to main
2. Frontend TT-120 (project setup) → merge to main
3. Backend TT-116, 117 → merge to main
4. Frontend TT-121, 122, 123, 124, 125 → can proceed in parallel
5. Backend TT-118, 119 → merge to main
6. Frontend PRs merged
7. TT-126 (integration) → single session, main branch
```

### Before Each Merge

1. Ensure CI passes (if configured)
2. Check for conflicts with other session's recent merges
3. Rebase on main if needed: `git pull --rebase origin main`

---

## Communication Between Sessions

### Via Linear

- Update issue status in real-time
- Add comments if blocked or waiting on other session

### Via Files

- This document serves as coordination reference
- Update `docs/internal-notes/2026-01-25-work-session-agenda.md` with progress

### Via You (Human)

- You're the coordinator - if Session B needs something from Session A, you relay
- Check both sessions periodically for questions or blockers

---

## Conflict Resolution

### If Both Sessions Need to Edit Same File

1. **Pause the second session** - Let the first one finish and merge
2. **Pull main** in the second session's worktree
3. **Continue** with updated file

### If Merge Conflict Occurs

1. Resolve in the session doing the merge
2. Notify the other session to pull main before continuing

---

## Session A (Backend) Current Status

- [x] TT-114: Backend project setup - **DONE** (merged)
- [ ] TT-115: Vector store provider - **NEXT**
- [ ] TT-116: Tenant management
- [ ] TT-117: RAG pipeline
- [ ] TT-118: Indexing script
- [ ] TT-119: API endpoints

## Session B (Frontend) Starting Point

- [ ] TT-120: Frontend project setup - **START HERE**
- [ ] TT-121: Chat components
- [ ] TT-122: Source components
- [ ] TT-123: Tenant components
- [ ] TT-124: Layout components
- [ ] TT-125: React Query + Zustand

---

## Quick Reference

| Task | Command |
|------|---------|
| List worktrees | `git worktree list` |
| Create worktree | `git worktree add <name> -b <branch>` |
| Remove worktree | `git worktree remove <name>` |
| Merge PR (squash) | `gh pr merge <num> --squash --delete-branch` |
| Check other session's PRs | `gh pr list` |
| Pull latest main | `cd main && git pull` |
