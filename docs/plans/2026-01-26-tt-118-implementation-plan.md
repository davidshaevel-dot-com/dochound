# TT-118: Document Indexing Script Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create an indexing script that processes tenant document corpora into vector stores with dry-run mode, configurable chunking, and backup safety.

**Architecture:** CLI script using existing TenantService for tenant discovery and VectorStoreFactory for vector store creation. Adds tiktoken for token counting and pdf-parse for PDF support. Implements backup/restore pattern for safe index rebuilds.

**Tech Stack:** TypeScript, LlamaIndex (SentenceSplitter, PDFReader, OpenAIEmbedding), tiktoken, pdf-parse

---

## Task 1: Add Dependencies

**Files:**
- Modify: `packages/backend/package.json`

**Step 1: Install new dependencies**

Run:
```bash
cd /Users/dshaevel/workspace-ds/dochound/tt-118-indexing-script/packages/backend
npm install tiktoken pdf-parse
npm install -D @types/pdf-parse
```

Expected: Dependencies added to package.json

**Step 2: Verify installation**

Run:
```bash
node -e "require('tiktoken'); require('pdf-parse'); console.log('OK')"
```

Expected: `OK`

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add tiktoken and pdf-parse dependencies for TT-118"
```

---

## Task 2: Update .env.example

**Files:**
- Modify: `packages/backend/.env.example`

**Step 1: Add indexing configuration variables**

Add to `.env.example`:
```bash
# Indexing configuration
# Chunk size in tokens (default: 1024)
CHUNK_SIZE=1024
# Overlap between chunks in tokens (default: 20)
CHUNK_OVERLAP=20

# Embedding model for vector generation
# Options:
#   text-embedding-3-small - $0.02/1M tokens, 1536 dimensions (recommended)
#   text-embedding-3-large - $0.13/1M tokens, 3072 dimensions (higher quality)
#   text-embedding-ada-002 - $0.10/1M tokens, 1536 dimensions (legacy)
EMBEDDING_MODEL=text-embedding-3-small
```

**Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: add indexing config vars to .env.example"
```

---

## Task 3: Implement CLI Argument Parsing

**Files:**
- Modify: `packages/backend/src/scripts/index-tenant.ts`

**Step 1: Implement argument parsing**

Replace contents of `index-tenant.ts`:

```typescript
/**
 * Document indexing script for tenant corpora
 *
 * Usage:
 *   npm run index -- --tenant=interview-prep          # Index single tenant
 *   npm run index -- --tenant=interview-prep --dry-run # Preview without indexing
 *   npm run index:all                                  # Index all tenants
 *   npm run index:all -- --dry-run                     # Preview all tenants
 */
import 'dotenv/config';

interface CLIArgs {
  tenant?: string;
  all: boolean;
  dryRun: boolean;
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const result: CLIArgs = {
    tenant: undefined,
    all: false,
    dryRun: false,
  };

  for (const arg of args) {
    if (arg.startsWith('--tenant=')) {
      result.tenant = arg.replace('--tenant=', '');
    } else if (arg === '--all') {
      result.all = true;
    } else if (arg === '--dry-run') {
      result.dryRun = true;
    }
  }

  return result;
}

function printUsage(): void {
  console.log(`
Usage:
  npm run index -- --tenant=<tenant-id>    Index a single tenant
  npm run index -- --tenant=<id> --dry-run Preview without indexing
  npm run index:all                        Index all tenants
  npm run index:all -- --dry-run           Preview all tenants
`);
}

async function main(): Promise<void> {
  const args = parseArgs();

  if (!args.tenant && !args.all) {
    printUsage();
    process.exit(1);
  }

  if (args.tenant && args.all) {
    console.error('[index] ERROR: Cannot specify both --tenant and --all');
    process.exit(1);
  }

  console.log('[index] Parsed args:', args);
  console.log('[index] TODO: Implement indexing logic');
}

main().catch((error) => {
  console.error('[index] Fatal error:', error);
  process.exit(1);
});
```

**Step 2: Test argument parsing**

Run:
```bash
npm run index -- --tenant=interview-prep --dry-run
```

Expected output includes: `Parsed args: { tenant: 'interview-prep', all: false, dryRun: true }`

Run:
```bash
npm run index:all
```

Expected output includes: `Parsed args: { tenant: undefined, all: true, dryRun: false }`

**Step 3: Verify typecheck passes**

Run:
```bash
npm run typecheck
```

Expected: No errors

**Step 4: Commit**

```bash
git add src/scripts/index-tenant.ts
git commit -m "feat(index): implement CLI argument parsing"
```

---

## Task 4: Implement Document Reading

**Files:**
- Modify: `packages/backend/src/scripts/index-tenant.ts`

**Step 1: Add file reading utilities**

Add imports and file reading functions after the `parseArgs` function:

```typescript
import { readdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, extname } from 'path';
import { Document, PDFReader } from 'llamaindex';

const SUPPORTED_EXTENSIONS = ['.md', '.txt', '.pdf'];

interface FileStats {
  md: number;
  txt: number;
  pdf: number;
  total: number;
}

interface ReadResult {
  documents: Document[];
  stats: FileStats;
}

async function readCorpusFiles(corpusPath: string): Promise<ReadResult> {
  if (!existsSync(corpusPath)) {
    throw new Error(`Corpus directory not found: ${corpusPath}`);
  }

  const files = await readdir(corpusPath);
  const stats: FileStats = { md: 0, txt: 0, pdf: 0, total: 0 };
  const documents: Document[] = [];

  const pdfReader = new PDFReader();

  for (const file of files) {
    const ext = extname(file).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      continue;
    }

    const filePath = join(corpusPath, file);

    try {
      if (ext === '.pdf') {
        const pdfDocs = await pdfReader.loadData(filePath);
        for (const doc of pdfDocs) {
          doc.metadata = { ...doc.metadata, filename: file };
          documents.push(doc);
        }
        stats.pdf++;
      } else {
        const content = await readFile(filePath, 'utf-8');
        documents.push(
          new Document({
            text: content,
            metadata: { filename: file },
          })
        );
        if (ext === '.md') stats.md++;
        else if (ext === '.txt') stats.txt++;
      }
      stats.total++;
    } catch (error) {
      throw new Error(
        `Failed to read file: ${filePath} - ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  if (stats.total === 0) {
    throw new Error(`No indexable files found in ${corpusPath}`);
  }

  return { documents, stats };
}
```

**Step 2: Verify typecheck passes**

Run:
```bash
npm run typecheck
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/scripts/index-tenant.ts
git commit -m "feat(index): add document reading with PDF support"
```

---

## Task 5: Implement Token Counting

**Files:**
- Modify: `packages/backend/src/scripts/index-tenant.ts`

**Step 1: Add token counting**

Add after the `readCorpusFiles` function:

```typescript
import { encoding_for_model, TiktokenModel } from 'tiktoken';

const EMBEDDING_COSTS: Record<string, number> = {
  'text-embedding-3-small': 0.02 / 1_000_000,
  'text-embedding-3-large': 0.13 / 1_000_000,
  'text-embedding-ada-002': 0.10 / 1_000_000,
};

function countTokens(documents: Document[]): number {
  // Use cl100k_base encoding (used by text-embedding-3-* models)
  const enc = encoding_for_model('text-embedding-3-small' as TiktokenModel);
  let totalTokens = 0;

  for (const doc of documents) {
    const text = doc.getText();
    totalTokens += enc.encode(text).length;
  }

  enc.free();
  return totalTokens;
}

function calculateCost(tokens: number, model: string): number {
  const costPerToken = EMBEDDING_COSTS[model] ?? EMBEDDING_COSTS['text-embedding-3-small'];
  return tokens * costPerToken;
}

function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(2)}`;
}
```

**Step 2: Verify typecheck passes**

Run:
```bash
npm run typecheck
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/scripts/index-tenant.ts
git commit -m "feat(index): add token counting and cost estimation"
```

---

## Task 6: Implement Dry-Run Mode

**Files:**
- Modify: `packages/backend/src/scripts/index-tenant.ts`

**Step 1: Add dry-run reporting**

Add after token counting functions:

```typescript
import { tenantService } from '../tenants/index.js';

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL ?? 'text-embedding-3-small';

function printDryRunReport(
  tenantId: string,
  stats: FileStats,
  tokens: number,
  model: string
): void {
  const cost = calculateCost(tokens, model);

  console.log('[index] DRY RUN - No changes will be made');
  console.log('[index] ════════════════════════════════════════════════════════');
  console.log(`[index] Tenant: ${tenantId}`);
  console.log('[index] ────────────────────────────────────────────────────────');
  console.log('[index] Files found:');
  console.log(`[index]   .md:  ${stats.md}`);
  console.log(`[index]   .txt: ${stats.txt}`);
  console.log(`[index]   .pdf: ${stats.pdf}`);
  console.log(`[index]   Total: ${stats.total}`);
  console.log('[index] ────────────────────────────────────────────────────────');
  console.log('[index] Estimated:');
  console.log(`[index]   Tokens: ~${tokens.toLocaleString()}`);
  console.log(`[index]   Cost:   ${formatCost(cost)} (${model})`);
  console.log('[index] ════════════════════════════════════════════════════════');
  console.log('[index] Run without --dry-run to proceed with indexing.');
}

async function processTenant(tenantId: string, dryRun: boolean): Promise<void> {
  const tenant = tenantService.getTenant(tenantId);
  if (!tenant) {
    const available = tenantService.getTenants().map((t) => t.id).join(', ');
    throw new Error(`Tenant "${tenantId}" not found. Available: ${available}`);
  }

  const { documents, stats } = await readCorpusFiles(tenant.corpusPath);
  const tokens = countTokens(documents);

  if (dryRun) {
    printDryRunReport(tenantId, stats, tokens, EMBEDDING_MODEL);
    return;
  }

  // TODO: Implement actual indexing in next task
  console.log(`[index] TODO: Index ${stats.total} documents for ${tenantId}`);
}
```

**Step 2: Update main function**

Replace the `main` function:

```typescript
async function main(): Promise<void> {
  const args = parseArgs();

  if (!args.tenant && !args.all) {
    printUsage();
    process.exit(1);
  }

  if (args.tenant && args.all) {
    console.error('[index] ERROR: Cannot specify both --tenant and --all');
    process.exit(1);
  }

  // Initialize tenant service
  await tenantService.initialize();

  if (args.all) {
    const tenants = tenantService.getTenants();
    if (tenants.length === 0) {
      console.error('[index] ERROR: No tenants found');
      process.exit(1);
    }
    for (const tenant of tenants) {
      await processTenant(tenant.id, args.dryRun);
    }
  } else if (args.tenant) {
    await processTenant(args.tenant, args.dryRun);
  }
}
```

**Step 3: Test dry-run mode**

Run:
```bash
npm run index -- --tenant=interview-prep --dry-run
```

Expected: Shows file counts, token estimate, and cost estimate

**Step 4: Verify typecheck passes**

Run:
```bash
npm run typecheck
```

Expected: No errors

**Step 5: Commit**

```bash
git add src/scripts/index-tenant.ts
git commit -m "feat(index): implement dry-run mode with cost preview"
```

---

## Task 7: Implement Index Backup/Restore

**Files:**
- Modify: `packages/backend/src/scripts/index-tenant.ts`

**Step 1: Add backup utilities**

Add after the dry-run functions:

```typescript
import { rename, rm } from 'fs/promises';

async function backupIndex(indexPath: string): Promise<boolean> {
  const backupPath = `${indexPath}.bak`;

  if (!existsSync(indexPath)) {
    return false; // No existing index to backup
  }

  // Remove old backup if exists
  if (existsSync(backupPath)) {
    await rm(backupPath, { recursive: true });
  }

  await rename(indexPath, backupPath);
  console.log('[index] Backed up existing index');
  return true;
}

async function restoreIndex(indexPath: string): Promise<void> {
  const backupPath = `${indexPath}.bak`;

  if (!existsSync(backupPath)) {
    return; // No backup to restore
  }

  // Remove partial index if exists
  if (existsSync(indexPath)) {
    await rm(indexPath, { recursive: true });
  }

  await rename(backupPath, indexPath);
  console.log('[index] Restored previous index from backup');
}

async function removeBackup(indexPath: string): Promise<void> {
  const backupPath = `${indexPath}.bak`;

  if (existsSync(backupPath)) {
    await rm(backupPath, { recursive: true });
    console.log('[index] Backup removed');
  }
}
```

**Step 2: Verify typecheck passes**

Run:
```bash
npm run typecheck
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/scripts/index-tenant.ts
git commit -m "feat(index): add index backup/restore utilities"
```

---

## Task 8: Implement Actual Indexing

**Files:**
- Modify: `packages/backend/src/scripts/index-tenant.ts`

**Step 1: Add indexing configuration and execution**

Add imports at the top:

```typescript
import {
  Document,
  PDFReader,
  SentenceSplitter,
  Settings,
  OpenAIEmbedding,
} from 'llamaindex';
import { VectorStoreFactory } from '../providers/index.js';
```

Add configuration constants after imports:

```typescript
const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE ?? '1024', 10);
const CHUNK_OVERLAP = parseInt(process.env.CHUNK_OVERLAP ?? '20', 10);
```

Add the indexing function after backup utilities:

```typescript
interface IndexResult {
  documents: number;
  chunks: number;
  tokens: number;
  cost: number;
  timeMs: number;
}

async function indexTenant(
  tenantId: string,
  indexPath: string,
  documents: Document[],
  tokens: number
): Promise<IndexResult> {
  const startTime = Date.now();

  // Configure chunking
  Settings.nodeParser = new SentenceSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  });

  // Configure embedding model
  Settings.embedModel = new OpenAIEmbedding({
    model: EMBEDDING_MODEL,
  });

  // Get vector store for tenant (creates fresh instance)
  const vectorStore = await VectorStoreFactory.getProviderForTenant(
    tenantId,
    indexPath,
    true // forceNew - don't load existing index
  );

  // Add documents (this chunks and embeds)
  await vectorStore.addDocuments(documents);

  // Persist to disk
  await vectorStore.persist();

  const timeMs = Date.now() - startTime;
  const cost = calculateCost(tokens, EMBEDDING_MODEL);

  // Get chunk count from the index
  // Note: LlamaIndex doesn't expose this directly, estimate from tokens/chunk_size
  const estimatedChunks = Math.ceil(tokens / CHUNK_SIZE);

  return {
    documents: documents.length,
    chunks: estimatedChunks,
    tokens,
    cost,
    timeMs,
  };
}
```

**Step 2: Update processTenant with full indexing logic**

Replace the `processTenant` function:

```typescript
async function processTenant(tenantId: string, dryRun: boolean): Promise<void> {
  const tenant = tenantService.getTenant(tenantId);
  if (!tenant) {
    const available = tenantService.getTenants().map((t) => t.id).join(', ');
    throw new Error(`Tenant "${tenantId}" not found. Available: ${available}`);
  }

  console.log('[index] ════════════════════════════════════════════════════════');
  console.log(`[index] Tenant: ${tenantId}`);
  console.log('[index] ────────────────────────────────────────────────────────');

  // Read documents
  console.log(`[index] Reading documents from ${tenant.corpusPath}`);
  const { documents, stats } = await readCorpusFiles(tenant.corpusPath);
  console.log(`[index]   Found ${stats.total} files (.md: ${stats.md}, .txt: ${stats.txt}, .pdf: ${stats.pdf})`);

  // Count tokens
  const tokens = countTokens(documents);

  if (dryRun) {
    console.log('[index] DRY RUN - No changes will be made');
    console.log('[index] ────────────────────────────────────────────────────────');
    console.log('[index] Estimated:');
    console.log(`[index]   Tokens: ~${tokens.toLocaleString()}`);
    console.log(`[index]   Cost:   ${formatCost(calculateCost(tokens, EMBEDDING_MODEL))} (${EMBEDDING_MODEL})`);
    console.log('[index] ════════════════════════════════════════════════════════');
    console.log('[index] Run without --dry-run to proceed with indexing.');
    return;
  }

  // Backup existing index
  const hadBackup = await backupIndex(tenant.indexPath);

  try {
    console.log(`[index] Processing with ${EMBEDDING_MODEL}...`);

    const result = await indexTenant(tenantId, tenant.indexPath, documents, tokens);

    console.log('[index] ────────────────────────────────────────────────────────');
    console.log('[index] Results:');
    console.log(`[index]   Documents: ${result.documents}`);
    console.log(`[index]   Chunks:    ~${result.chunks}`);
    console.log(`[index]   Tokens:    ${result.tokens.toLocaleString()}`);
    console.log(`[index]   Est. cost: ${formatCost(result.cost)}`);
    console.log(`[index]   Time:      ${(result.timeMs / 1000).toFixed(1)}s`);
    console.log('[index] ────────────────────────────────────────────────────────');
    console.log(`[index] Index saved to ${tenant.indexPath}`);

    // Remove backup on success
    if (hadBackup) {
      await removeBackup(tenant.indexPath);
    }

    console.log('[index] ════════════════════════════════════════════════════════');
  } catch (error) {
    console.error(`[index] ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);

    // Restore backup on failure
    if (hadBackup) {
      console.log('[index] Restoring previous index from backup...');
      await restoreIndex(tenant.indexPath);
      console.log('[index] Previous index restored. System remains functional.');
    }

    throw error;
  }
}
```

**Step 3: Verify typecheck passes**

Run:
```bash
npm run typecheck
```

Expected: No errors (may need to update VectorStoreFactory - see Task 9)

**Step 4: Commit**

```bash
git add src/scripts/index-tenant.ts
git commit -m "feat(index): implement full indexing with backup/restore"
```

---

## Task 9: Update VectorStoreFactory for Fresh Index Creation

**Files:**
- Modify: `packages/backend/src/providers/vector-store.factory.ts`

**Step 1: Read current factory implementation**

Check current implementation to understand needed changes.

**Step 2: Add forceNew parameter**

Update `getProviderForTenant` to accept optional `forceNew` parameter that bypasses cache and creates fresh provider:

```typescript
static async getProviderForTenant(
  tenantId: string,
  indexPath: string,
  forceNew: boolean = false
): Promise<VectorStoreProvider> {
  // If forceNew, skip cache and create fresh instance
  if (!forceNew && this.providers.has(tenantId)) {
    return this.providers.get(tenantId)!;
  }

  const provider = new SimpleVectorStoreProvider();
  await provider.initialize({ tenantId, indexPath });

  // Only cache if not forceNew
  if (!forceNew) {
    this.providers.set(tenantId, provider);
  }

  return provider;
}
```

**Step 3: Verify typecheck passes**

Run:
```bash
npm run typecheck
```

Expected: No errors

**Step 4: Commit**

```bash
git add src/providers/vector-store.factory.ts
git commit -m "feat(providers): add forceNew option to VectorStoreFactory"
```

---

## Task 10: Test Full Integration

**Step 1: Run dry-run on interview-prep**

Run:
```bash
npm run index -- --tenant=interview-prep --dry-run
```

Expected: Shows file counts, token estimate, cost estimate

**Step 2: Run actual indexing on interview-prep**

Run:
```bash
npm run index -- --tenant=interview-prep
```

Expected: Successfully indexes documents, shows metrics, creates index-data/

**Step 3: Verify index was created**

Run:
```bash
ls -la /Users/dshaevel/workspace-ds/dochound/tt-118-indexing-script/packages/backend/tenants/interview-prep/index-data/
```

Expected: docstore.json and other index files exist

**Step 4: Run index:all with dry-run**

Run:
```bash
npm run index:all -- --dry-run
```

Expected: Shows estimates for all tenants

**Step 5: Run lint and typecheck**

Run:
```bash
npm run lint && npm run typecheck
```

Expected: No errors

**Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix: address any issues found during integration testing"
```

---

## Task 11: Final Commit and Push

**Step 1: Review all changes**

Run:
```bash
git log --oneline main..HEAD
```

**Step 2: Push branch**

Run:
```bash
git push -u origin david/tt-118-indexing-script
```

**Step 3: Create PR**

Run:
```bash
gh pr create --title "TT-118: Create document indexing script for tenants" --body "$(cat <<'EOF'
## Summary

- Implement document indexing script with dry-run mode for cost preview
- Support .md, .txt, and .pdf files
- Configurable chunking (CHUNK_SIZE, CHUNK_OVERLAP env vars)
- Configurable embedding model (EMBEDDING_MODEL env var)
- Token counting and cost estimation via tiktoken
- Backup/restore safety for index rebuilds

## Test plan

- [ ] `npm run index -- --tenant=interview-prep --dry-run` shows cost preview
- [ ] `npm run index -- --tenant=interview-prep` successfully indexes
- [ ] `npm run index:all` indexes all tenants
- [ ] Backup/restore works on simulated failure
- [ ] Typecheck and lint pass

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR created successfully
