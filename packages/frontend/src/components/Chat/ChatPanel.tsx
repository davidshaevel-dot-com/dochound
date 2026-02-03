import { useChatStore } from '@/stores/chatStore';
import { useTenantStore } from '@/stores/tenantStore';
import { useChat } from '@/hooks';
import { TenantBadge } from '@/components/Tenant';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import styles from './ChatPanel.module.css';

interface ChatPanelProps {
  currentTenantName: string;
}

/**
 * Main chat container - orchestrates message flow
 */
export function ChatPanel({ currentTenantName }: ChatPanelProps) {
  const { currentTenant } = useTenantStore();
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
