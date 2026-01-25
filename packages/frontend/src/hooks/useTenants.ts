import { useQuery } from '@tanstack/react-query';
import { getTenants, getTenant, Tenant } from '@/api/client';

/**
 * Hook for fetching all tenants
 */
export function useTenants() {
  return useQuery<Tenant[]>({
    queryKey: ['tenants'],
    queryFn: getTenants,
  });
}

/**
 * Hook for fetching a specific tenant
 */
export function useTenant(tenantId: string) {
  return useQuery<Tenant>({
    queryKey: ['tenant', tenantId],
    queryFn: () => getTenant(tenantId),
    enabled: !!tenantId,
  });
}
