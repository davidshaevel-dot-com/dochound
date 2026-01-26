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

  return result.nodes.map((node, index) => {
    const metadata = node.node.metadata;
    const filename =
      typeof metadata?.filename === 'string' ? metadata.filename : 'unknown';
    const nodeWithText = node.node as { text?: unknown };
    const text =
      typeof nodeWithText.text === 'string' ? nodeWithText.text : '';

    return {
      id: `${index + 1}`,
      filename,
      text,
      score: node.score ?? 0,
    };
  });
}
