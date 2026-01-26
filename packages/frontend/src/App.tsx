import { useTenantStore } from './stores/tenantStore';
import { useTenants } from './hooks';
import styles from './App.module.css';

// Fallback tenants when API is unavailable (graceful degradation)
// TODO: For production, consider disabling the selector on error instead of falling back
const FALLBACK_TENANTS = [
  { id: 'interview-prep', name: 'Interview Prep', documentCount: 0 },
  { id: 'manufacturing-demo', name: 'Manufacturing Demo', documentCount: 0 },
];

function App() {
  const { currentTenant, setTenant } = useTenantStore();
  const { data: tenants, isLoading, isError } = useTenants();

  // Use API tenants if available, otherwise fall back to hardcoded list
  const availableTenants = tenants ?? (isError ? FALLBACK_TENANTS : []);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>DocHound</h1>
        <p className={styles.tagline}>Sniff out answers from your technical documents</p>
        <div className={styles.tenantSelector}>
          <label htmlFor="tenant-select">Tenant:</label>
          <select
            id="tenant-select"
            value={currentTenant}
            onChange={(e) => setTenant(e.target.value)}
            disabled={isLoading}
          >
            {isLoading ? (
              <option>Loading...</option>
            ) : (
              availableTenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))
            )}
          </select>
        </div>
      </header>
      <main className={styles.main}>
        <p>Chat interface coming soon...</p>
        <p>Current tenant: <strong>{currentTenant}</strong></p>
      </main>
    </div>
  );
}

export default App;
