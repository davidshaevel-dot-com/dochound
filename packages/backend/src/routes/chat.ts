/**
 * Chat API routes
 *
 * POST /api/tenants/:tenantId/chat - Send message and get RAG response
 */
import { Router, Request, Response, NextFunction } from 'express';
import { ragService } from '../rag/index.js';
import { tenantService } from '../tenants/index.js';

export const chatRouter = Router();

/**
 * API request body for chat endpoint
 */
interface ChatRequestBody {
  message: string;
  conversationId?: string; // Reserved for future use
}

/**
 * API response type for chat (matches frontend ChatResponse interface)
 */
interface ChatApiResponse {
  message: string;
  sources: Array<{
    documentId: string;
    documentName: string;
    excerpt: string;
    score?: number;
  }>;
}

/**
 * POST /api/tenants/:tenantId/chat
 * Send a chat message and get RAG-powered response
 */
chatRouter.post(
  '/:tenantId/chat',
  async (req: Request<{ tenantId: string }, unknown, ChatRequestBody>, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req.params;
      const { message } = req.body;

      // Validate tenant exists
      const tenant = tenantService.getTenant(tenantId);
      if (!tenant) {
        res.status(404).json({
          error: 'Not Found',
          message: `Tenant '${tenantId}' not found`,
        });
        return;
      }

      // Validate request body
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Message is required and must be a non-empty string',
        });
        return;
      }

      // Call RAG service
      const ragResponse = await ragService.chat({
        tenantId,
        message: message.trim(),
      });

      // Map to API response format (matches frontend expectations)
      const response: ChatApiResponse = {
        message: ragResponse.answer,
        sources: ragResponse.sources.map((source) => ({
          documentId: source.id,
          documentName: source.filename,
          excerpt: source.text,
          score: source.score,
        })),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);
