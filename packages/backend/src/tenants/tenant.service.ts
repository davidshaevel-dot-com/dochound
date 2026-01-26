import { readdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import type { TenantConfig, TenantJsonConfig } from './tenant.interface.js';
import { VectorStoreFactory, type VectorStoreProvider } from '../providers/index.js';

/**
 * Derive display name from tenant ID.
 * "manufacturing-demo" → "Manufacturing Demo"
 */
function deriveDisplayName(id: string): string {
  return id
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Service for managing multi-tenant configuration and vector stores.
 *
 * Features:
 * - Auto-discovers tenants from filesystem
 * - Supports optional tenant.json for display name overrides
 * - Lazy initialization of vector stores (delegated to VectorStoreFactory)
 */
export class TenantService {
  private tenants: Map<string, TenantConfig> = new Map();
  private initialized = false;
  private tenantsBasePath: string;

  constructor(tenantsBasePath?: string) {
    // Default to packages/backend/tenants/
    this.tenantsBasePath = tenantsBasePath ?? join(process.cwd(), 'tenants');
  }

  /**
   * Discover and load all tenants from filesystem.
   * Call once at server startup.
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (!existsSync(this.tenantsBasePath)) {
      throw new Error(`Tenants directory not found: ${this.tenantsBasePath}`);
    }

    const entries = await readdir(this.tenantsBasePath, { withFileTypes: true });
    const directories = entries.filter(entry => entry.isDirectory());

    // Process tenants in parallel
    const tenantPromises = directories.map(async (dir) => {
      const tenantId = dir.name;
      const tenantPath = join(this.tenantsBasePath, tenantId);
      const corpusPath = join(tenantPath, 'corpus');

      // Skip directories without corpus folder
      if (!existsSync(corpusPath)) {
        console.warn(`[TenantService] Skipping ${tenantId}: no corpus/ directory`);
        return null;
      }

      // Load optional tenant.json
      let displayName = deriveDisplayName(tenantId);
      const configPath = join(tenantPath, 'tenant.json');

      if (existsSync(configPath)) {
        try {
          const configContent = await readFile(configPath, 'utf-8');
          const config: TenantJsonConfig = JSON.parse(configContent);
          if (config.name) {
            displayName = config.name;
          }
        } catch (error) {
          console.warn(`[TenantService] Invalid tenant.json for ${tenantId}, using defaults`);
        }
      }

      const tenantConfig: TenantConfig = {
        id: tenantId,
        name: displayName,
        corpusPath,
        indexPath: join(tenantPath, 'index-data'),
      };

      return tenantConfig;
    });

    const tenantResults = (await Promise.all(tenantPromises)).filter(
      (t): t is TenantConfig => t !== null
    );

    for (const tenantConfig of tenantResults) {
      this.tenants.set(tenantConfig.id, tenantConfig);
      console.log(`[TenantService] Discovered tenant: ${tenantConfig.id} ("${tenantConfig.name}")`);
    }

    if (this.tenants.size === 0) {
      console.warn('[TenantService] No tenants found in', this.tenantsBasePath);
    }

    this.initialized = true;
    console.log(`[TenantService] Initialized with ${this.tenants.size} tenant(s)`);
  }

  /**
   * Get all available tenants.
   */
  getTenants(): TenantConfig[] {
    return Array.from(this.tenants.values());
  }

  /**
   * Get a specific tenant by ID.
   */
  getTenant(id: string): TenantConfig | undefined {
    return this.tenants.get(id);
  }

  /**
   * Get vector store for a tenant.
   * VectorStoreFactory handles caching of providers per tenant.
   */
  async getVectorStore(tenantId: string): Promise<VectorStoreProvider> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Unknown tenant: ${tenantId}`);
    }

    return VectorStoreFactory.getProviderForTenant(tenantId, tenant.indexPath);
  }

  /**
   * Check if service has been initialized.
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Singleton instance for use across the application
export const tenantService = new TenantService();
