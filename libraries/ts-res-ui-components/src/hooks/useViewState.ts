import { useState, useCallback } from 'react';
import { Message } from '../types';

/**
 * Return type for the useViewState hook.
 *
 * @public
 */
export interface UseViewStateReturn {
  /** Array of current messages (info, warning, error, success) */
  messages: Message[];
  /** Currently selected resource ID */
  selectedResourceId: string | null;
  /** Add a new message to the message list */
  addMessage: (type: Message['type'], message: string) => void;
  /** Clear all messages */
  clearMessages: () => void;
  /** Select a resource by ID */
  selectResource: (resourceId: string | null) => void;
}

/**
 * Hook for managing view state including messages and resource selection.
 *
 * This hook provides a centralized way to manage common view state concerns
 * like user messages (notifications) and resource selection. It's designed
 * to be used by view components that need to display messages and track
 * the currently selected resource.
 *
 * @example
 * ```tsx
 * function MyResourceView() {
 *   const {
 *     messages,
 *     selectedResourceId,
 *     addMessage,
 *     clearMessages,
 *     selectResource
 *   } = useViewState();
 *
 *   const handleOperation = async () => {
 *     try {
 *       await someAsyncOperation();
 *       addMessage('success', 'Operation completed successfully');
 *     } catch (error) {
 *       addMessage('error', `Operation failed: ${error.message}`);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <MessageDisplay messages={messages} onClear={clearMessages} />
 *       <ResourcePicker
 *         selectedResourceId={selectedResourceId}
 *         onResourceSelect={(selection) => selectResource(selection.resourceId)}
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns Object containing view state and state management functions
 * @public
 */
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
