import { useTenantStore } from '@/stores/tenantStore';
import { useChatStore } from '@/stores/chatStore';
import { useTenants } from '@/hooks';
import { AppShell, Header } from '@/components/Layout';
import { ChatPanel } from '@/components/Chat';
import { SourcePanel } from '@/components/Sources';

// Fallback tenants when API is unavailable (graceful degradation)
// TODO: For production, consider disabling the selector on error instead of falling back
const FALLBACK_TENANTS = [
  { id: 'interview-prep', name: 'Interview Prep', documentCount: 0 },
  { id: 'manufacturing-demo', name: 'Manufacturing Demo', documentCount: 0 },
];

function App() {
  const { currentTenant, setTenant } = useTenantStore();
  const clearMessages = useChatStore((state) => state.clearMessages);
  const { data: tenants, isLoading, isError } = useTenants();

  // Use API tenants if available, otherwise fall back to hardcoded list
  const availableTenants = tenants ?? (isError ? FALLBACK_TENANTS : []);

  // Look up current tenant name for display
  const currentTenantName =
    availableTenants.find((t) => t.id === currentTenant)?.name ?? currentTenant;

  const handleTenantChange = (tenantId: string) => {
    setTenant(tenantId);
    clearMessages();
  };

  return (
    <AppShell
      header={
        <Header
          tenants={availableTenants}
          currentTenant={currentTenant}
          onTenantChange={handleTenantChange}
          isLoading={isLoading}
        />
      }
      main={<ChatPanel currentTenantName={currentTenantName} />}
      sidebar={<SourcePanel />}
    />
  );
}

export default App;
