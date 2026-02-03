import styles from './TenantBadge.module.css';

interface TenantBadgeProps {
  tenantName: string;
}

/**
 * Displays the current tenant context in the chat area
 * Shows which document collection is being searched
 */
export function TenantBadge({ tenantName }: TenantBadgeProps) {
  return (
    <div className={styles.badge}>
      <span className={styles.icon} role="img" aria-label="Documents">📚</span>
      <span className={styles.label}>Searching:</span>
      <span className={styles.name}>{tenantName}</span>
    </div>
  );
}
