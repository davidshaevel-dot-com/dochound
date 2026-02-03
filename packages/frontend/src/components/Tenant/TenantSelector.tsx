import type { Tenant } from '@/types';
import styles from './TenantSelector.module.css';

interface TenantSelectorProps {
  tenants: Tenant[];
  currentTenant: string;
  onTenantChange: (tenantId: string) => void;
  isLoading?: boolean;
}

/**
 * Dropdown component for switching between tenants
 */
export function TenantSelector({
  tenants,
  currentTenant,
  onTenantChange,
  isLoading = false,
}: TenantSelectorProps) {
  return (
    <div className={styles.selector}>
      <label htmlFor="tenant-select">Tenant:</label>
      <select
        id="tenant-select"
        value={currentTenant}
        onChange={(e) => onTenantChange(e.target.value)}
        disabled={isLoading || tenants.length === 0}
      >
        {isLoading ? (
          <option key="loading" value={currentTenant}>Loading...</option>
        ) : tenants.length === 0 ? (
          <option key="empty" value="">No tenants available</option>
        ) : (
          tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
