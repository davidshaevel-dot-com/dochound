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
import { readdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, extname } from 'path';
import { Document, PDFReader } from 'llamaindex';
import { encoding_for_model, TiktokenModel } from 'tiktoken';
import { tenantService } from '../tenants/index.js';

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
