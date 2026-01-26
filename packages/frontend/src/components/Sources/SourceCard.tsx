import { useState } from 'react';
import { Source } from '@/api/client';
import styles from './SourceCard.module.css';

interface SourceCardProps {
  source: Source;
  index: number;
  isSelected: boolean;
  onSelect: (index: number) => void;
}

/**
 * Displays a single source citation with document name, relevance score, and expandable excerpt
 */
export function SourceCard({ source, index, isSelected, onSelect }: SourceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    onSelect(index);
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const scorePercent = Math.round(source.score * 100);
  const shouldTruncate = source.excerpt.length > 150;
  const showExpandButton = shouldTruncate;

  return (
    <div
      className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className={styles.header}>
        <span className={styles.citation}>[{index + 1}]</span>
        <span className={styles.documentName} title={source.documentName}>
          {source.documentName}
        </span>
      </div>

      <div className={styles.scoreContainer}>
        <div className={styles.scoreBar}>
          <div
            className={styles.scoreFill}
            style={{ width: `${scorePercent}%` }}
          />
        </div>
        <span className={styles.scoreText}>{scorePercent}%</span>
      </div>

      <div
        className={`${styles.excerpt} ${shouldTruncate && !isExpanded ? styles.excerptTruncated : ''}`}
      >
        {source.excerpt}
      </div>

      {showExpandButton && (
        <button
          type="button"
          className={styles.expandButton}
          onClick={handleExpandClick}
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}
