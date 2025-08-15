import { useState, useCallback } from 'react';
import { Message } from '../types';

export interface UseViewStateReturn {
  messages: Message[];
  selectedResourceId: string | null;
  addMessage: (type: Message['type'], message: string) => void;
  clearMessages: () => void;
  selectResource: (resourceId: string | null) => void;
}

export function useViewState(): UseViewStateReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);

  const addMessage = useCallback((type: Message['type'], message: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      type,
      message,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, newMessage]);

    // No auto-clearing - let users manage messages with filters
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const selectResource = useCallback((resourceId: string | null) => {
    setSelectedResourceId(resourceId);
  }, []);

  return {
    messages,
    selectedResourceId,
    addMessage,
    clearMessages,
    selectResource
  };
}
