// src/components/Chat/MessageList.tsx
import { useEffect, useRef } from 'react';
import { ChatMessage } from '@/api/client';
import { Message } from './Message';
import styles from './ChatPanel.module.css';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  onCitationClick?: (index: number) => void;
}

/**
 * Scrollable list of chat messages with auto-scroll
 */
export function MessageList({ messages, isLoading, onCitationClick }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className={styles.messageList}>
        <div className={styles.emptyState}>
          Ask a question to get started
        </div>
      </div>
    );
  }

  return (
    <div className={styles.messageList}>
      {messages.map((message, index) => (
        <Message
          key={index}
          message={message}
          onCitationClick={onCitationClick}
        />
      ))}
      {isLoading && (
        <div className={styles.loading}>
          Thinking...
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
