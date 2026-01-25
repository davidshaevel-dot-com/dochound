// Vector store provider interface and types
export type {
  VectorStoreProvider,
  VectorStoreConfig,
  VectorQueryResult,
} from './vector-store.interface.js';

// Implementations
export { SimpleVectorStoreProvider } from './simple-vector-store.provider.js';

// Factory
export { VectorStoreFactory, type VectorStoreType } from './vector-store.factory.js';
