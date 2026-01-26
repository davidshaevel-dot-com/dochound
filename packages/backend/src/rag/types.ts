/**
 * RAG pipeline types
 */

/** Individual chat message */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Request to the RAG service */
export interface ChatRequest {
  tenantId: string;
  message: string;
  conversationHistory?: ChatMessage[];
}

/** Source document returned with response */
export interface Source {
  /** Unique identifier for the chunk (matches citation number) */
  id: string;
  /** Original document filename */
  filename: string;
  /** Chunk text (for UI expansion) */
  text: string;
  /** Relevance score (0-1) */
  score: number;
}

/** Response from the RAG service */
export interface ChatResponse {
  /** Answer with inline citations [1], [2] */
  answer: string;
  /** Source metadata for frontend display */
  sources: Source[];
}
