import {
  Document,
  VectorStoreIndex,
  storageContextFromDefaults,
} from 'llamaindex';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import type {
  VectorStoreProvider,
  VectorStoreConfig,
  VectorQueryResult,
} from './vector-store.interface.js';

/**
 * SimpleVectorStoreProvider - File-based vector store using LlamaIndex.
 *
 * Features:
 * - Zero external dependencies (no Docker, no database)
 * - Persists to filesystem for easy debugging
 * - Perfect for development and small-scale deployments
 */
export class SimpleVectorStoreProvider implements VectorStoreProvider {
  private config: VectorStoreConfig | null = null;
  private index: VectorStoreIndex | null = null;

  async initialize(config: VectorStoreConfig): Promise<void> {
    this.config = config;

    // Ensure index directory exists
    await mkdir(config.indexPath, { recursive: true });

    // Check if existing index exists
    if (this.hasIndex()) {
      // Load existing index from persisted storage
      const storageContext = await storageContextFromDefaults({
        persistDir: config.indexPath,
      });
      this.index = await VectorStoreIndex.init({
        storageContext,
      });
      console.log(`[${config.tenantId}] Loaded existing vector index from ${config.indexPath}`);
    } else {
      console.log(`[${config.tenantId}] No existing index found (will create on addDocuments)`);
    }
  }

  async addDocuments(documents: Document[]): Promise<void> {
    if (!this.config) {
      throw new Error('Provider not initialized. Call initialize() first.');
    }

    // If index already exists, insert documents (additive)
    if (this.index) {
      for (const doc of documents) {
        await this.index.insert(doc);
      }
      console.log(`[${this.config.tenantId}] Added ${documents.length} documents to existing index`);
    } else {
      // Create new index from documents
      const storageContext = await storageContextFromDefaults({
        persistDir: this.config.indexPath,
      });

      this.index = await VectorStoreIndex.fromDocuments(documents, {
        storageContext,
      });
      console.log(`[${this.config.tenantId}] Created new index with ${documents.length} documents`);
    }
  }

  async query(queryText: string, topK: number = 5): Promise<VectorQueryResult> {
    if (!this.index) {
      throw new Error('No index available. Call initialize() and addDocuments() first.');
    }

    const retriever = this.index.asRetriever({ similarityTopK: topK });
    const nodes = await retriever.retrieve(queryText);

    return { nodes };
  }

  async persist(): Promise<void> {
    if (!this.config) {
      throw new Error('Provider not initialized. Call initialize() first.');
    }

    if (!this.index) {
      console.log(`[${this.config.tenantId}] No index to persist`);
      return;
    }

    // VectorStoreIndex automatically persists when using storageContext
    // But we can explicitly persist the storage context
    const storageContext = this.index.storageContext;
    await storageContext.docStore.persist(this.config.indexPath);
    await storageContext.indexStore?.persist(this.config.indexPath);

    console.log(`[${this.config.tenantId}] Persisted index to ${this.config.indexPath}`);
  }

  hasIndex(): boolean {
    if (!this.config) {
      return false;
    }

    // Check for LlamaIndex storage files
    const docStorePath = join(this.config.indexPath, 'docstore.json');
    return existsSync(docStorePath);
  }
}
