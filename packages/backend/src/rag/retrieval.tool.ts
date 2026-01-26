/**
 * Document retrieval tool for OpenAI function calling
 */
import type { ChatCompletionTool } from 'openai/resources/chat/completions';
import { tenantService } from '../tenants/index.js';
import type { Source } from './types.js';

/** OpenAI function definition for document retrieval */
export const retrieveDocumentsTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'retrieve_documents',
    description:
      'Search the document corpus for relevant information. Always call this before answering questions.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query to find relevant documents',
        },
      },
      required: ['query'],
    },
  },
};

/**
 * Execute the retrieval tool against a tenant's vector store
 */
export async function executeRetrieval(
  tenantId: string,
  query: string,
  topK: number = 5
): Promise<Source[]> {
  const vectorStore = await tenantService.getVectorStore(tenantId);
  const result = await vectorStore.query(query, topK);

  return result.nodes.map((node, index) => ({
    id: `${index + 1}`,
    filename: (node.node.metadata?.filename as string) ?? 'unknown',
    text: (node.node as { text?: string }).text ?? '',
    score: node.score ?? 0,
  }));
}
