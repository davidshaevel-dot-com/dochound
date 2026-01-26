/**
 * Verification script for TT-116 tenant management
 */
import { TenantService } from '../tenants/index.js';

async function main() {
  const service = new TenantService('./tenants');
  await service.initialize();

  console.log('\n=== TT-116 Verification ===');
  console.log('Tenants found:', service.getTenants().length);
  service.getTenants().forEach(t => console.log('  -', t.id, '→', t.name));

  const mfg = service.getTenant('manufacturing-demo');
  const prep = service.getTenant('interview-prep');

  console.log('\nGet by ID:');
  console.log('  manufacturing-demo:', mfg ? 'FOUND' : 'NOT FOUND');
  console.log('  interview-prep:', prep ? 'FOUND' : 'NOT FOUND');

  console.log('\nPaths:');
  if (mfg) {
    console.log('  mfg corpus:', mfg.corpusPath);
    console.log('  mfg index:', mfg.indexPath);
  }
  if (prep) {
    console.log('  prep corpus:', prep.corpusPath);
    console.log('  prep index:', prep.indexPath);
  }

  // Verify acceptance criteria
  console.log('\n=== Acceptance Criteria ===');
  const criteria = [
    { name: 'Discovers manufacturing-demo', pass: !!mfg },
    { name: 'Discovers interview-prep', pass: !!prep },
    { name: 'Tenant retrievable by ID', pass: !!mfg && !!prep },
    { name: 'Has corpusPath', pass: !!mfg?.corpusPath && !!prep?.corpusPath },
    { name: 'Has indexPath', pass: !!mfg?.indexPath && !!prep?.indexPath },
  ];

  let allPass = true;
  for (const c of criteria) {
    console.log(`  [${c.pass ? '✓' : '✗'}] ${c.name}`);
    if (!c.pass) allPass = false;
  }

  console.log('\nResult:', allPass ? 'ALL PASS' : 'SOME FAILED');
  process.exit(allPass ? 0 : 1);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
