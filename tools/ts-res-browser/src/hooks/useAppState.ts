import { useState, useCallback } from 'react';
import { AppState, AppActions, Tool, Message } from '../types/app';

export const useAppState = (): { state: AppState; actions: AppActions } => {
  const [state, setState] = useState<AppState>({
    selectedTool: 'import',
    messages: []
  });

  const setSelectedTool = useCallback((tool: Tool, force?: boolean) => {
    setState((prev) => ({ ...prev, selectedTool: tool }));
  }, []);

  const addMessage = useCallback((type: Message['type'], message: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date()
    };
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));
  }, []);

  const clearMessages = useCallback(() => {
    setState((prev) => ({ ...prev, messages: [] }));
  }, []);

  const actions: AppActions = {
    setSelectedTool,
    addMessage,
    clearMessages
  };

  return { state, actions };
};
