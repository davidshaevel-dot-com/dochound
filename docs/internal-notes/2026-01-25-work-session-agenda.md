# DocHound Work Session Agenda

**Date:** Sunday, January 25, 2026
**Deadline:** End of day Monday, January 26, 2026
**Interview:** Tuesday, January 27, 2026 (Jackie Padgett, CPO @ Circuit)

---

## Project Overview

**DocHound** - "Sniff out answers from your technical documents"

A multi-tenant RAG-powered document intelligence platform demonstrating:
- Circuit's exact tech stack (React, TypeScript, React Query, Zustand, CSS Modules)
- Two-stage forced function calling RAG pattern (from Ella)
- Multi-tenant document isolation

**Current State:** Documentation complete, interview-prep corpus loaded (16 files), zero implementation code.

---

## Session Structure

### Session 1: Sunday (Today) - Backend Foundation

**Goal:** Complete backend with working RAG pipeline and indexed tenants

| Order | Issue | Description |
|-------|-------|-------------|
| 1 | TT-114 | Backend project setup (Express + TypeScript) |
| 2 | TT-115 | Pluggable vector store provider architecture |
| 3 | TT-116 | Tenant management system |
| 4 | TT-117 | Two-stage RAG pipeline with forced function calling |
| 5 | TT-118 | Document indexing script |
| 6 | TT-119 | API endpoints (chat + tenant routes) |

**End-of-session checkpoint:**
- [ ] `npm run dev` starts backend on :3001
- [ ] `npm run index:all` indexes both tenants
- [ ] `curl POST /api/tenants/interview-prep/chat` returns RAG response
- [ ] Source citations included in response

---

### Session 2: Monday - Frontend + Polish

**Goal:** Complete frontend UI and prepare for demo

| Order | Issue | Description |
|-------|-------|-------------|
| 1 | TT-120 | Frontend project setup (Vite + React) |
| 2 | TT-125 | React Query hooks and Zustand store |
| 3 | TT-124 | Layout components (AppShell, Header) |
| 4 | TT-123 | Tenant components (TenantSelector, TenantBadge) |
| 5 | TT-121 | Chat components (ChatPanel, MessageList, etc.) |
| 6 | TT-122 | Source components (SourcePanel, SourceCard) |
| 7 | TT-126 | End-to-end testing and demo preparation |

**End-of-session checkpoint:**
- [ ] Full UI working with both tenants
- [ ] Tenant switching works
- [ ] Source citations clickable and highlight
- [ ] Demo queries tested and verified
- [ ] Backup screen recording created

---

## Linear Project

**Project:** [DocHound - Multi-Tenant Document Intelligence](https://linear.app/davidshaevel-dot-com/project/dochound-multi-tenant-document-intelligence-85c346ead335)

### All Issues (13 total)

**Sunday - Backend (6 issues):**
- [TT-114](https://linear.app/davidshaevel-dot-com/issue/TT-114) - Backend project setup
- [TT-115](https://linear.app/davidshaevel-dot-com/issue/TT-115) - Vector store provider architecture
- [TT-116](https://linear.app/davidshaevel-dot-com/issue/TT-116) - Tenant management system
- [TT-117](https://linear.app/davidshaevel-dot-com/issue/TT-117) - Two-stage RAG pipeline
- [TT-118](https://linear.app/davidshaevel-dot-com/issue/TT-118) - Document indexing script
- [TT-119](https://linear.app/davidshaevel-dot-com/issue/TT-119) - API endpoints

**Monday - Frontend (7 issues):**
- [TT-120](https://linear.app/davidshaevel-dot-com/issue/TT-120) - Frontend project setup
- [TT-121](https://linear.app/davidshaevel-dot-com/issue/TT-121) - Chat components
- [TT-122](https://linear.app/davidshaevel-dot-com/issue/TT-122) - Source components
- [TT-123](https://linear.app/davidshaevel-dot-com/issue/TT-123) - Tenant components
- [TT-124](https://linear.app/davidshaevel-dot-com/issue/TT-124) - Layout components + branding
- [TT-125](https://linear.app/davidshaevel-dot-com/issue/TT-125) - React Query hooks + Zustand store
- [TT-126](https://linear.app/davidshaevel-dot-com/issue/TT-126) - E2E testing + demo prep

---

## Today's Todo List (Sunday)

### Setup
- [ ] Ensure OPENAI_API_KEY is set in environment
- [ ] Review project proposal for reference

### Implementation (in order)
- [ ] **TT-114:** Create backend package.json, tsconfig, Express skeleton
- [ ] **TT-115:** Implement VectorStoreProvider interface + SimpleVectorStore
- [ ] **TT-116:** Implement TenantService with tenant discovery
- [ ] **TT-117:** Implement two-stage RAG (forced retrieval + grounded synthesis)
- [ ] **TT-118:** Create indexing script, run `npm run index:all`
- [ ] **TT-119:** Wire up API routes, test with curl

### Verification
- [ ] Test chat endpoint with interview-prep tenant
- [ ] Verify sources are returned with citations
- [ ] Commit all work with proper Linear issue references

---

## Demo Strategy Reminder

**The Meta Angle:** During the interview:
1. Show manufacturing-demo processing technical docs (Circuit's domain)
2. Switch to interview-prep, ask about Circuit/Ella
3. Watch DocHound answer in real-time from your prep docs
4. Explain: "This is the exact pattern I'd bring to your document AI platform"

**Sample Demo Queries:**
- "How does Ella's permission model work?"
- "What should I emphasize about my AI experience with Jackie?"
- "How does Ella relate to Circuit's needs?"

---

## Notes

- Use `superpowers` skills throughout (TDD, verification, etc.)
- Commit messages: `feat(scope): description` + `related-issues: TT-XXX`
- Reference: PrepBot backend at `~/workspace-ds/prepbot/main/packages/backend`
