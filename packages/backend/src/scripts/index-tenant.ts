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
