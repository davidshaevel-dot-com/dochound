import type { Tenant } from '@/types';
import { TenantSelector } from '@/components/Tenant';
import styles from './Header.module.css';

interface HeaderProps {
  tenants: Tenant[];
  currentTenant: string;
  onTenantChange: (tenantId: string) => void;
  isLoading?: boolean;
}

/**
 * Application header with DocHound branding and tenant selector
 */
export function Header({
  tenants,
  currentTenant,
  onTenantChange,
  isLoading = false,
}: HeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>DocHound</h1>
      <p className={styles.tagline}>Sniff out answers from your technical documents</p>
      <TenantSelector
        tenants={tenants}
        currentTenant={currentTenant}
        onTenantChange={onTenantChange}
        isLoading={isLoading}
      />
    </header>
  );
}
