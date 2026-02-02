import { useChatStore } from '@/stores/chatStore';
import { useTenantStore } from '@/stores/tenantStore';
import { useChat, useTenants } from '@/hooks';
import { TenantBadge } from '@/components/Tenant';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import styles from './ChatPanel.module.css';

/**
 * Main chat container - orchestrates message flow
 */
export function ChatPanel() {
  const { currentTenant } = useTenantStore();
  const { data: tenants } = useTenants();
  const {
    messages,
    isLoading,
    error,
    addUserMessage,
    addAssistantMessage,
    setLoading,
    setError,
    setSelectedSource,
  } = useChatStore();

  const chat = useChat({
    tenantId: currentTenant,
    onSuccess: (data) => {
      addAssistantMessage(data.message, data.sources);
      setLoading(false);
    },
    onError: (err) => {
      setError(err.message || 'Failed to send message. Please try again.');
    },
  });

  const handleSubmit = (message: string) => {
    addUserMessage(message);
    setLoading(true);
    setError(null);
    chat.mutate(message);
  };

  const handleCitationClick = (index: number) => {
    setSelectedSource(index);
  };

  // Look up current tenant name from the tenants list
  const currentTenantName =
    tenants?.find((t) => t.id === currentTenant)?.name ?? currentTenant;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <TenantBadge tenantName={currentTenantName} />
      </div>
      <MessageList
        messages={messages}
        isLoading={isLoading}
        onCitationClick={handleCitationClick}
      />
      <MessageInput
        onSubmit={handleSubmit}
        disabled={isLoading}
        error={error}
      />
    </div>
  );
}
