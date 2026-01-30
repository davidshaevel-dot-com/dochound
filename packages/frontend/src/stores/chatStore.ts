import { create } from 'zustand';
import { ChatMessage, Source } from '@/api/client';

interface ChatStore {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  selectedSourceIndex: number | null;

  addUserMessage: (content: string) => void;
  addAssistantMessage: (content: string, sources: Source[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedSource: (index: number | null) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isLoading: false,
  error: null,
  selectedSourceIndex: null,

  addUserMessage: (content) =>
    set((state) => ({
      messages: [...state.messages, { role: 'user', content }],
      error: null,
    })),

  addAssistantMessage: (content, sources) =>
    set((state) => ({
      messages: [...state.messages, { role: 'assistant', content, sources }],
      // Clear source selection when new response arrives (user will select from new sources)
      selectedSourceIndex: null,
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ isLoading: false, error }),

  setSelectedSource: (index) => set({ selectedSourceIndex: index }),

  clearMessages: () => set({ messages: [], error: null, selectedSourceIndex: null }),
}));
