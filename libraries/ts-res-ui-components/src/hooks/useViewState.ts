import { useState, useCallback } from 'react';
import { IMessage } from '../types';

/**
 * Return type for the useViewState hook.
 *
 * @public
 */
export interface IUseViewStateReturn {
  /** Array of current messages (info, warning, error, success) */
  messages: IMessage[];
  /** Currently selected resource ID */
  selectedResourceId: string | null;
  /** Add a new message to the message list */
  addMessage: (type: IMessage['type'], message: string) => void;
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
 *     addIMessage,
 *     clearIMessages,
 *     selectResource
 *   } = useViewState();
 *
 *   const handleOperation = async () => {
 *     try {
 *       await someAsyncOperation();
 *       addIMessage('success', 'Operation completed successfully');
 *     } catch (error) {
 *       addIMessage('error', `Operation failed: ${error.message}`);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <IMessageDisplay messages={messages} onClear={clearIMessages} />
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
export function useViewState(): IUseViewStateReturn {
  const [messages, setIMessages] = useState<IMessage[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);

  const addMessage = useCallback((type: IMessage['type'], message: string) => {
    const newMessage: IMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      type,
      message,
      timestamp: new Date()
    };

    setIMessages((prev) => [...prev, newMessage]);

    // No auto-clearing - let users manage messages with filters
  }, []);

  const clearMessages = useCallback(() => {
    setIMessages([]);
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
