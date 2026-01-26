// RAG types
export type { ChatRequest, ChatResponse, ChatMessage, Source } from './types.js';

// RAG service
export { RAGService, ragService } from './rag.service.js';

// Prompts (for testing/customization)
export {
  STAGE1_SYSTEM_PROMPT,
  STAGE2_SYSTEM_PROMPT,
  formatSourcesForPrompt,
} from './prompts.js';
