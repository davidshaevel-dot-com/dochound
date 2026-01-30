import { useMemo } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { SourceCard } from './SourceCard';
import styles from './SourcePanel.module.css';

/**
 * Container component that displays sources from the latest assistant message
 * in a right sidebar panel
 */
export function SourcePanel() {
  const { messages, selectedSourceIndex, setSelectedSource } = useChatStore();

  // Get sources from the latest assistant message (memoized to avoid array copy on each render)
  const sources = useMemo(() => {
    const latestAssistantMessage = [...messages]
      .reverse()
      .find((m) => m.role === 'assistant');
    return latestAssistantMessage?.sources ?? [];
  }, [messages]);

  const handleSelect = (index: number) => {
    // Toggle selection if clicking the same source
    setSelectedSource(selectedSourceIndex === index ? null : index);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Sources</h3>
        {sources.length > 0 && (
          <span className={styles.count}>{sources.length}</span>
        )}
      </div>

      <div className={styles.content}>
        {sources.length === 0 ? (
          <div className={styles.emptyState}>
            Sources will appear here when you ask a question
          </div>
        ) : (
          sources.map((source, index) => (
            <SourceCard
              key={`${source.documentId}-${index}`}
              source={source}
              index={index}
              isSelected={selectedSourceIndex === index}
              onSelect={handleSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}
