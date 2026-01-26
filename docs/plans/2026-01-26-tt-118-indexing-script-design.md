# TT-118: Document Indexing Script Design

**Date:** January 26, 2026
**Issue:** [TT-118](https://linear.app/davidshaevel-dot-com/issue/TT-118/create-document-indexing-script-for-tenants)

---

## Overview

Create an indexing script to process tenant document corpora into vector stores for RAG retrieval.

**CLI Commands:**

```bash
# Preview cost without indexing
npm run index -- --tenant=interview-prep --dry-run

# Index all tenants with preview
npm run index:all -- --dry-run

# Actually perform indexing
npm run index -- --tenant=interview-prep
npm run index:all
```

---

## Design Decisions

### Chunking Strategy

**Choice:** Env-var configurable with sensible defaults

- `CHUNK_SIZE=1024` (tokens per chunk)
- `CHUNK_OVERLAP=20` (overlap between chunks)

LlamaIndex's `SentenceSplitter` handles the actual chunking.

### Re-indexing Behavior

**Choice:** Full rebuild with backup safety

- Delete existing index before re-indexing
- Backup previous index to `index-data.bak/`
- Restore on failure, delete backup on success

### File Support

**Supported types:**
- `.md` - Markdown files
- `.txt` - Text files
- `.pdf` - PDF documents (via LlamaIndex PDFReader)

### Error Handling

**Choice:** Fail-fast with rollback

- Stop on first error
- Restore previous index from backup
- Clear error messages with actionable guidance

---

## Architecture & Data Flow

```
npm run index -- --tenant=interview-prep
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│                    index-tenant.ts                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Parse CLI args (--tenant, --all, --dry-run)             │
│  2. Initialize TenantService                                │
│  3. For each tenant:                                        │
│     ┌─────────────────────────────────────────────────────┐│
│     │ a. Read .md/.txt/.pdf files from corpus/            ││
│     │ b. Count tokens (tiktoken)                          ││
│     │ c. If --dry-run: show estimates and exit            ││
│     │ d. Backup existing index-data/ to index-data.bak/   ││
│     │ e. Create LlamaIndex Documents                      ││
│     │ f. Configure SentenceSplitter (chunk size/overlap)  ││
│     │ g. Configure embedding model from env               ││
│     │ h. Call vectorStore.addDocuments()                  ││
│     │ i. Persist index                                    ││
│     │ j. Delete backup on success / restore on failure    ││
│     │ k. Report metrics                                   ││
│     └─────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Integration points:**
- Uses existing `TenantService` for tenant discovery and paths
- Uses existing `VectorStoreFactory` for vector store creation

---

## Configuration

**Environment Variables (.env.example):**

```bash
# Chunking configuration
CHUNK_SIZE=1024          # Token count per chunk (default: 1024)
CHUNK_OVERLAP=20         # Overlap between chunks (default: 20)

# Embedding model for vector generation
# Options:
#   text-embedding-3-small - $0.02/1M tokens, 1536 dimensions (recommended)
#   text-embedding-3-large - $0.13/1M tokens, 3072 dimensions (higher quality)
#   text-embedding-ada-002 - $0.10/1M tokens, 1536 dimensions (legacy)
EMBEDDING_MODEL=text-embedding-3-small
```

**Cost calculation (hardcoded):**

```typescript
const EMBEDDING_COSTS: Record<string, number> = {
  'text-embedding-3-small': 0.02 / 1_000_000,
  'text-embedding-3-large': 0.13 / 1_000_000,
  'text-embedding-ada-002': 0.10 / 1_000_000,
};
```

---

## Output Format

### Dry-Run Mode

```
[index] DRY RUN - No changes will be made
[index] ════════════════════════════════════════════════════════
[index] Tenant: interview-prep
[index] ────────────────────────────────────────────────────────
[index] Files found:
[index]   .md:  14
[index]   .txt: 2
[index]   .pdf: 0
[index]   Total: 16
[index] ────────────────────────────────────────────────────────
[index] Estimated:
[index]   Tokens: ~45,230
[index]   Cost:   $0.0009 (text-embedding-3-small)
[index] ════════════════════════════════════════════════════════
[index] Run without --dry-run to proceed with indexing.
```

### Actual Indexing

```
[index] ════════════════════════════════════════════════════════
[index] Tenant: interview-prep
[index] ────────────────────────────────────────────────────────
[index] Backing up existing index...
[index] Reading documents from corpus/
[index]   Found 16 files (.md: 14, .txt: 2, .pdf: 0)
[index] Processing with text-embedding-3-small...
[index] ────────────────────────────────────────────────────────
[index] Results:
[index]   Documents: 16
[index]   Chunks:    142
[index]   Tokens:    45,230
[index]   Est. cost: $0.0009
[index]   Time:      12.3s
[index] ────────────────────────────────────────────────────────
[index] Index saved to tenants/interview-prep/index-data/
[index] Backup removed.
[index] ════════════════════════════════════════════════════════
```

### Error with Rollback

```
[index] ERROR: Embedding failed: Rate limit exceeded
[index] Restoring previous index from backup...
[index] Previous index restored. System remains functional.
```

---

## Error Handling

| Error Scenario | Behavior |
|----------------|----------|
| Invalid `--tenant` argument | Exit with error listing available tenants |
| Corpus directory empty | Exit with error: no indexable files found |
| File read error | Exit with error showing file path and reason |
| PDF parse error | Exit with error showing file path and reason |
| OpenAI API error | Rollback index, exit with API error message |
| Missing OPENAI_API_KEY | Exit with clear error message |

**Exit codes:**
- `0` - Success
- `1` - Error

**Rollback behavior:**
1. Before indexing: `index-data/` → `index-data.bak/`
2. On success: Delete `index-data.bak/`
3. On failure: Delete partial `index-data/`, restore `index-data.bak/`

---

## Dependencies

**New dependencies to add:**

```bash
npm install tiktoken pdf-parse
```

| Package | Purpose |
|---------|---------|
| `tiktoken` | Token counting for cost estimation |
| `pdf-parse` | PDF text extraction (LlamaIndex peer dep) |

---

## File Structure

```
packages/backend/
├── src/
│   └── scripts/
│       └── index-tenant.ts    # Main indexing script (update existing)
├── package.json               # Add tiktoken, pdf-parse
└── .env.example               # Add CHUNK_SIZE, CHUNK_OVERLAP, EMBEDDING_MODEL
```

---

## Acceptance Criteria

From TT-118:
- [x] Successfully indexes all 16 interview-prep documents
- [x] Index persists to `tenants/{id}/index-data/`
- [x] Script reports progress and document count

Additional from design:
- [ ] `--dry-run` flag shows cost estimate without indexing
- [ ] Configurable chunk size/overlap via env vars
- [ ] Configurable embedding model via env var
- [ ] PDF support via LlamaIndex PDFReader
- [ ] Backup/restore safety for index rebuilds
- [ ] Token count and cost estimation in output
