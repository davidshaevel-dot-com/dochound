import type { Document, NodeWithScore } from 'llamaindex';

/**
 * Query result from vector store
 */
export interface VectorQueryResult {
  nodes: NodeWithScore[];
}

/**
 * Configuration for initializing a vector store provider
 */
export interface VectorStoreConfig {
  tenantId: string;
  indexPath: string; // Path to persist/load index data
}

/**
 * Pluggable vector store provider interface.
 *
 * Implementations:
 * - SimpleVectorStoreProvider: File-based, zero dependencies (default)
 * - ChromaDBProvider: Production-grade (future)
 */
export interface VectorStoreProvider {
  /**
   * Initialize the vector store for a tenant.
   * Loads existing index if available, otherwise creates empty store.
   */
  initialize(config: VectorStoreConfig): Promise<void>;

  /**
   * Add documents to the vector store.
   * Documents are chunked and embedded before storage.
   */
  addDocuments(documents: Document[]): Promise<void>;

  /**
   * Query the vector store for relevant document chunks.
   * @param query - The search query
   * @param topK - Number of results to return (default: 5)
   */
  query(query: string, topK?: number): Promise<VectorQueryResult>;

  /**
   * Persist the vector store to disk.
   */
  persist(): Promise<void>;

  /**
   * Check if an index exists for the configured tenant.
   */
  hasIndex(): boolean;
}
