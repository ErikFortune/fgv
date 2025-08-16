/**
 * Tools and components for view state management and message handling.
 *
 * This namespace contains components and utilities for managing application view state,
 * displaying messages, and providing user feedback in development tools and interactive
 * applications. Includes the MessagesWindow component for comprehensive message management.
 *
 * @example
 * ```typescript
 * import { ViewTools } from '@fgv/ts-res-ui-components';
 *
 * // Use the MessagesWindow component
 * function MyTool() {
 *   const [messages, setMessages] = useState<ViewTools.Message[]>([]);
 *
 *   const addMessage = (type: ViewTools.Message['type'], text: string) => {
 *     setMessages(prev => [...prev, {
 *       id: `msg-${Date.now()}`,
 *       type,
 *       message: text,
 *       timestamp: new Date()
 *     }]);
 *   };
 *
 *   return React.createElement('div', {},
 *     React.createElement('button',
 *       { onClick: () => addMessage('info', 'Operation started') },
 *       'Add Message'
 *     ),
 *     React.createElement(ViewTools.MessagesWindow, {
 *       messages,
 *       onClearMessages: () => setMessages([])
 *     })
 *   );
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Integration with application state
 * import { ViewTools } from '@fgv/ts-res-ui-components';
 *
 * interface AppState {
 *   messages: ViewTools.Message[];
 *   // ... other state
 * }
 *
 * function App() {
 *   const [state, setState] = useState<AppState>({
 *     messages: []
 *   });
 *
 *   const onMessage = (type: ViewTools.Message['type'], message: string) => {
 *     setState(prev => ({
 *       ...prev,
 *       messages: [...prev.messages, {
 *         id: `msg-${Date.now()}-${Math.random()}`,
 *         type,
 *         message,
 *         timestamp: new Date()
 *       }]
 *     }));
 *   };
 *
 *   // Component creates MessagesWindow at bottom of screen
 *   return React.createElement('div', { className: 'flex flex-col h-screen' },
 *     React.createElement('div', { className: 'flex-1' },
 *       React.createElement(SomeComponent, { onMessage })
 *     ),
 *     React.createElement(ViewTools.MessagesWindow, {
 *       messages: state.messages,
 *       onClearMessages: () => setState(prev => ({ ...prev, messages: [] }))
 *     })
 *   );
 * }
 * ```
 *
 * @public
 */

// Export the main MessagesWindow component
export { MessagesWindow } from '../components/views/MessagesWindow';

// Export types for external consumption
export type { Message, MessagesWindowProps } from '../components/views/MessagesWindow';
