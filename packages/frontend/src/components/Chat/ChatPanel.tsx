import { useEffect } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useTenantStore } from '@/stores/tenantStore';
import { useChat } from '@/hooks';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import styles from './ChatPanel.module.css';

/**
 * Main chat container - orchestrates message flow
 */
export function ChatPanel() {
  const { currentTenant } = useTenantStore();
  const {
    messages,
    isLoading,
    error,
    addUserMessage,
    addAssistantMessage,
    setLoading,
    setError,
    clearMessages,
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

  // Clear messages when tenant changes
  useEffect(() => {
    clearMessages();
  }, [currentTenant]);

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
