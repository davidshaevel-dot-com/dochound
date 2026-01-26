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
