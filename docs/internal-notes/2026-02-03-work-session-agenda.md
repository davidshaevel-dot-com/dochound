# DocHound Work Session Agenda

**Date:** Tuesday, February 3, 2026
**Focus:** End-to-end integration testing and demo preparation
**Remaining Issue:** TT-126

---

## Project Status

**Progress:** 12/13 issues complete (92%)

| Category | Status |
|----------|--------|
| Backend (6 issues) | 6/6 Done |
| Frontend (6 issues) | 6/6 Done |
| Testing (1 issue) | 0/1 Backlog |

**Current State:** MVP is functionally complete. All implementation work is done. The final ticket (TT-126) covers integration testing and demo preparation.

---

## Today's Goal

Complete **TT-126: End-to-end integration testing and demo preparation**

This includes:
- Verifying both tenants work end-to-end
- Testing source citations and tenant switching
- Preparing demo queries for each tenant
- Optionally creating a backup screen recording

---

## Session Agenda

### 1. Environment Setup (5 min)

```bash
# Terminal 1: Backend
cd /Users/dshaevel/workspace-ds/dochound/main/packages/backend
npm run dev

# Terminal 2: Frontend
cd /Users/dshaevel/workspace-ds/dochound/main/packages/frontend
npm run dev
```

**Verify:**
- [ ] Backend health check: `curl http://localhost:3001/api/health`
- [ ] Frontend loads at http://localhost:5173

---

### 2. Integration Testing - Interview-Prep Tenant (15 min)

Test queries from TT-126 acceptance criteria:

| Query | Expected Behavior |
|-------|-------------------|
| "How does Ella's permission model work?" | Returns answer with source citations from Ella docs |
| "What should I emphasize about my AI experience?" | Cites interview prep documents |
| "How does Ella relate to Circuit's needs?" | Cites ella-circuit connection documents |

**Verify for each query:**
- [ ] Response includes inline citations [1], [2], etc.
- [ ] Clicking citations highlights correct source in panel
- [ ] Source excerpts are relevant to the question
- [ ] Relevance scores display correctly

---

### 3. Integration Testing - Manufacturing-Demo Tenant (10 min)

- [ ] Switch tenants via dropdown in header
- [ ] Verify conversation clears on tenant switch
- [ ] Test query: "What are the safety procedures?"
- [ ] Verify sources come from manufacturing corpus only

---

### 4. Cross-Tenant Testing (5 min)

- [ ] Rapid tenant switching doesn't cause state issues
- [ ] Each tenant's responses only cite its own documents
- [ ] No cross-tenant data leakage
- [ ] Conversation history isolated per tenant

---

### 5. Demo Query Documentation (15 min)

Document the best demo queries for future use:

**Interview-Prep Tenant (Best Queries):**
1. ___________________________________
2. ___________________________________
3. ___________________________________

**Manufacturing-Demo Tenant (Best Queries):**
1. ___________________________________
2. ___________________________________
3. ___________________________________

---

### 6. Bug Fixes (as needed)

Address any issues discovered during testing. Create new issues if needed for non-blocking improvements.

---

### 7. Completion

- [ ] Update TT-126 status to Done in Linear
- [ ] Post completion comment on TT-126
- [ ] Update project status if appropriate

---

## Stretch Goals (If Time Permits)

- [ ] Create screen recording of successful demo flow
- [ ] Add Sherlock mascot image to header branding
- [ ] Investigate streaming responses for better UX
- [ ] Update success criteria checkboxes in CLAUDE.md

---

## Linear References

**Project:** [DocHound - Multi-Tenant Document Intelligence](https://linear.app/davidshaevel-dot-com/project/dochound-multi-tenant-document-intelligence-85c346ead335)

**Remaining Issue:**
- [TT-126](https://linear.app/davidshaevel-dot-com/issue/TT-126) - End-to-end integration testing and demo preparation

---

## Quick Reference

**Start Backend:**
```bash
cd /Users/dshaevel/workspace-ds/dochound/main/packages/backend && npm run dev
```

**Start Frontend:**
```bash
cd /Users/dshaevel/workspace-ds/dochound/main/packages/frontend && npm run dev
```

**Re-index Tenants (if needed):**
```bash
cd /Users/dshaevel/workspace-ds/dochound/main/packages/backend && npm run index:all
```

**Health Check:**
```bash
curl http://localhost:3001/api/health
```

**Test Chat API:**
```bash
curl -X POST http://localhost:3001/api/tenants/interview-prep/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is Ella?"}'
```
