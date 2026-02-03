/**
 * Two-stage RAG pipeline service with forced function calling
 *
 * Stage 1: Forced retrieval (tool_choice: required)
 * Stage 2: Grounded synthesis (tool_choice: none)
 */
import OpenAI from 'openai';
import { tenantService } from '../tenants/index.js';
import { retrieveDocumentsTool, executeRetrieval } from './retrieval.tool.js';
import {
  STAGE1_SYSTEM_PROMPT,
  STAGE2_SYSTEM_PROMPT,
  formatSourcesForPrompt,
} from './prompts.js';
import type { ChatRequest, ChatResponse } from './types.js';

/** Model to use for chat completions (configurable via env var) */
const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

// Fail fast if API key is missing
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

export class RAGService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI(); // Uses OPENAI_API_KEY env var
  }

  /**
   * Process a chat request through the two-stage RAG pipeline
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    // Validate tenant exists
    const tenant = tenantService.getTenant(request.tenantId);
    if (!tenant) {
      throw new Error(`Unknown tenant: ${request.tenantId}`);
    }

    // Stage 1: Forced retrieval
    const stage1Response = await this.openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: STAGE1_SYSTEM_PROMPT },
        { role: 'user', content: request.message },
      ],
      tools: [retrieveDocumentsTool],
      tool_choice: {
        type: 'function',
        function: { name: 'retrieve_documents' },
      },
    });

    // Extract query from tool call
    const toolCall = stage1Response.choices[0].message.tool_calls?.[0];
    if (!toolCall) {
      console.error(
        '[RAG] Model did not call retrieve_documents tool. Full response:',
        JSON.stringify(stage1Response, null, 2)
      );
      throw new Error('Model did not call retrieve_documents tool');
    }

    const { query } = JSON.parse(toolCall.function.arguments) as {
      query: string;
    };

    // Execute retrieval against tenant's vector store
    const sources = await executeRetrieval(request.tenantId, query);

    if (sources.length === 0) {
      console.warn(`[RAG] No documents found for query: ${query}`);
    }

    // Stage 2: Grounded synthesis
    const stage2Prompt = STAGE2_SYSTEM_PROMPT.replace(
      '{{documents}}',
      formatSourcesForPrompt(sources)
    );

    const stage2Response = await this.openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: stage2Prompt },
        { role: 'user', content: request.message },
      ],
      // No tools specified = no tool calls possible
    });

    return {
      answer: stage2Response.choices[0].message.content ?? '',
      sources,
    };
  }
}

/** Singleton instance for use across the application */
export const ragService = new RAGService();
