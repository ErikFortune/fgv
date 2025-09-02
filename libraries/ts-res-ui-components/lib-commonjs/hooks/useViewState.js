'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.useViewState = useViewState;
const react_1 = require('react');
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
function useViewState() {
  const [messages, setMessages] = (0, react_1.useState)([]);
  const [selectedResourceId, setSelectedResourceId] = (0, react_1.useState)(null);
  const addMessage = (0, react_1.useCallback)((type, message) => {
    const newMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      type,
      message,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, newMessage]);
    // No auto-clearing - let users manage messages with filters
  }, []);
  const clearMessages = (0, react_1.useCallback)(() => {
    setMessages([]);
  }, []);
  const selectResource = (0, react_1.useCallback)((resourceId) => {
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
//# sourceMappingURL=useViewState.js.map
