import type { ChatMessage } from '@/types';
import styles from './Message.module.css';

interface MessageProps {
  message: ChatMessage;
  onCitationClick?: (index: number) => void;
}

/**
 * Renders a single chat message with citation support
 */
export function Message({ message, onCitationClick }: MessageProps) {
  const isUser = message.role === 'user';

  // Parse content for citation patterns [1], [2], etc.
  const renderContent = () => {
    const parts = message.content.split(/(\[\d+\])/g);

    return parts.map((part, i) => {
      const citationMatch = part.match(/\[(\d+)\]/);
      if (citationMatch) {
        const index = parseInt(citationMatch[1], 10) - 1;
        const hasSource = message.sources && message.sources[index];

        if (hasSource && onCitationClick) {
          return (
            <button
              key={i}
              className={styles.citation}
              onClick={() => onCitationClick(index)}
              type="button"
            >
              {part}
            </button>
          );
        }
        // Render as plain text if no matching source
        return <span key={i}>{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div
      className={`${styles.message} ${isUser ? styles.user : styles.assistant}`}
    >
      <div className={styles.content}>{renderContent()}</div>
    </div>
  );
}
