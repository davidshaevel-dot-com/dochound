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
import { readdir, readFile, rename, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join, extname } from 'path';
import {
  Document,
  PDFReader,
  SentenceSplitter,
  Settings,
  OpenAIEmbedding,
} from 'llamaindex';
import { encoding_for_model, TiktokenModel } from 'tiktoken';
import { tenantService } from '../tenants/index.js';
import { VectorStoreFactory } from '../providers/index.js';

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

const EMBEDDING_COSTS: Record<string, number> = {
  'text-embedding-3-small': 0.02 / 1_000_000,
  'text-embedding-3-large': 0.13 / 1_000_000,
  'text-embedding-ada-002': 0.10 / 1_000_000,
};

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL ?? 'text-embedding-3-small';
const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE ?? '1024', 10);
const CHUNK_OVERLAP = parseInt(process.env.CHUNK_OVERLAP ?? '20', 10);

function countTokens(documents: Document[]): number {
  // All supported embedding models use cl100k_base encoding
  const enc = encoding_for_model(EMBEDDING_MODEL as TiktokenModel);
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

main().catch((error) => {
  console.error('[index] Fatal error:', error);
  process.exit(1);
});
