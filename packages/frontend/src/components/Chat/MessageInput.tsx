import { useState, FormEvent, KeyboardEvent } from 'react';
import styles from './MessageInput.module.css';

interface MessageInputProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
  error?: string | null;
}

/**
 * Chat input form with submit button
 */
export function MessageInput({ onSubmit, disabled, error }: MessageInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed && !disabled) {
      onSubmit(trimmed);
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter, newline on Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.inputRow}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question..."
          disabled={disabled}
          className={styles.textarea}
          rows={1}
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className={styles.button}
        >
          {disabled ? 'Sending...' : 'Send'}
        </button>
      </div>
    </form>
  );
}
