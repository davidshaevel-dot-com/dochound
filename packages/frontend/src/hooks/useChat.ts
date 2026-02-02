import { useMutation } from '@tanstack/react-query';
import { sendChatMessage } from '@/api/client';
import type { UseChatOptions } from '@/types';

/**
 * Hook for sending chat messages to a tenant
 */
export function useChat({ tenantId, onSuccess, onError }: UseChatOptions) {
  return useMutation({
    mutationFn: (message: string) => sendChatMessage(tenantId, message),
    onSuccess,
    onError,
  });
}
