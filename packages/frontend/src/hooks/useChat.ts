import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendChatMessage, ChatResponse } from '@/api/client';

interface UseChatOptions {
  tenantId: string;
  onSuccess?: (data: ChatResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for sending chat messages to a tenant
 */
export function useChat({ tenantId, onSuccess, onError }: UseChatOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (message: string) => sendChatMessage(tenantId, message),
    onSuccess: (data) => {
      // Invalidate any tenant-related queries
      queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
      onSuccess?.(data);
    },
    onError,
  });
}
