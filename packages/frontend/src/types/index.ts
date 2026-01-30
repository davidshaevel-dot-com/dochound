/**
 * Shared type definitions for DocHound frontend
 */

// =============================================================================
// API Types - Match backend response shapes
// =============================================================================

/**
 * A source document citation returned from RAG retrieval
 */
export interface Source {
  documentId: string;
  documentName: string;
  excerpt: string;
  score: number;
}

/**
 * A single message in the chat conversation
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
}

/**
 * Response from the chat API endpoint
 */
export interface ChatResponse {
  message: string;
  sources: Source[];
}

/**
 * A tenant (isolated document collection)
 */
export interface Tenant {
  id: string;
  name: string;
  documentCount: number;
}

// =============================================================================
// Hook Types
// =============================================================================

/**
 * Options for the useChat hook
 */
export interface UseChatOptions {
  tenantId: string;
  onSuccess?: (data: ChatResponse) => void;
  onError?: (error: Error) => void;
}
