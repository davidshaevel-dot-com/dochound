import { useTenantStore } from './stores/tenantStore';
import styles from './App.module.css';

function App() {
  const { currentTenant, setTenant } = useTenantStore();

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
          >
            <option value="interview-prep">Interview Prep</option>
            <option value="manufacturing-demo">Manufacturing Demo</option>
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
