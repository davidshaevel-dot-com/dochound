/**
 * Configuration for a tenant in the multi-tenant system.
 */
export interface TenantConfig {
  /** Directory name (e.g., "manufacturing-demo") */
  id: string;
  /** Display name (from tenant.json or derived from id) */
  name: string;
  /** Absolute path to corpus directory */
  corpusPath: string;
  /** Absolute path to index-data directory */
  indexPath: string;
}

/**
 * Optional tenant.json configuration schema.
 * Place in tenant directory to override defaults.
 */
export interface TenantJsonConfig {
  /** Override display name */
  name?: string;
  // Future: chunking settings, model preferences, etc.
}
