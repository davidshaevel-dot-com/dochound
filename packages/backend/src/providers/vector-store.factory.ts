import type { VectorStoreProvider, VectorStoreConfig } from './vector-store.interface.js';
import { SimpleVectorStoreProvider } from './simple-vector-store.provider.js';

/**
 * Supported vector store provider types
 */
export type VectorStoreType = 'simple' | 'chroma';

/**
 * Factory for creating vector store providers.
 *
 * Reads VECTOR_STORE env var to determine which implementation to use:
 * - 'simple' (default): File-based SimpleVectorStore
 * - 'chroma': ChromaDB (future implementation)
 *
 * Manages per-tenant provider instances to ensure index isolation.
 */
export class VectorStoreFactory {
  private static instances: Map<string, VectorStoreProvider> = new Map();

  /** Private constructor - this class is not meant to be instantiated */
  private constructor() {}

  /**
   * Get the configured vector store type from environment
   */
  static getConfiguredType(): VectorStoreType {
    const envValue = process.env.VECTOR_STORE?.toLowerCase();

    if (envValue === 'chroma') {
      return 'chroma';
    }

    return 'simple'; // Default
  }

  /**
   * Create a new provider instance (not initialized)
   */
  static createProvider(type?: VectorStoreType): VectorStoreProvider {
    const providerType = type ?? this.getConfiguredType();

    switch (providerType) {
      case 'simple':
        return new SimpleVectorStoreProvider();

      case 'chroma':
        // TODO: Implement ChromaDBProvider in future
        throw new Error(
          'ChromaDB provider not yet implemented. Use VECTOR_STORE=simple for now.'
        );

      default:
        throw new Error(`Unknown vector store type: ${providerType}`);
    }
  }

  /**
   * Get or create an initialized provider for a specific tenant.
   * Providers are cached per tenant to ensure isolation.
   *
   * @param tenantId - The tenant identifier
   * @param indexPath - Path to store/load the index
   * @param forceNew - If true, creates fresh provider bypassing cache (for re-indexing)
   */
  static async getProviderForTenant(
    tenantId: string,
    indexPath: string,
    forceNew: boolean = false
  ): Promise<VectorStoreProvider> {
    // If forceNew, skip cache and create fresh instance
    if (!forceNew) {
      const cached = this.instances.get(tenantId);
      if (cached) {
        return cached;
      }
    }

    // Create and initialize new provider
    const provider = this.createProvider();
    const config: VectorStoreConfig = { tenantId, indexPath };

    await provider.initialize(config);

    // Only cache if not forceNew
    if (!forceNew) {
      this.instances.set(tenantId, provider);
    }

    return provider;
  }

  /**
   * Clear all cached provider instances.
   * Useful for testing or when reconfiguring tenants.
   */
  static clearCache(): void {
    this.instances.clear();
  }

  /**
   * Remove a specific tenant's provider from cache.
   */
  static removeFromCache(tenantId: string): boolean {
    return this.instances.delete(tenantId);
  }
}
