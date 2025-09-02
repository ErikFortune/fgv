'use strict';
/**
 * Tools and components for view state management and message handling.
 *
 * This namespace contains components and utilities for managing application view state,
 * displaying messages, and providing user feedback in development tools and interactive
 * applications. Includes the MessagesWindow component for comprehensive message management.
 *
 * @example
 * ```typescript
 * import { ViewStateTools } from '@fgv/ts-res-ui-components';
 *
 * // Use the MessagesWindow component
 * function MyTool() {
 *   const [messages, setMessages] = useState<ViewStateTools.Message[]>([]);
 *
 *   const addMessage = (type: ViewStateTools.Message['type'], text: string) => {
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
 *     React.createElement(ViewStateTools.MessagesWindow, {
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
 * import { ViewStateTools } from '@fgv/ts-res-ui-components';
 *
 * interface AppState {
 *   messages: ViewStateTools.Message[];
 *   // ... other state
 * }
 *
 * function App() {
 *   const [state, setState] = useState<AppState>({
 *     messages: []
 *   });
 *
 *   const onMessage = (type: ViewStateTools.Message['type'], message: string) => {
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
 *     React.createElement(ViewStateTools.MessagesWindow, {
 *       messages: state.messages,
 *       onClearMessages: () => setState(prev => ({ ...prev, messages: [] }))
 *     })
 *   );
 * }
 * ```
 *
 * @public
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.useViewState = exports.MessagesWindow = void 0;
// Export the main MessagesWindow component
var MessagesWindow_1 = require('../components/views/MessagesWindow');
Object.defineProperty(exports, 'MessagesWindow', {
  enumerable: true,
  get: function () {
    return MessagesWindow_1.MessagesWindow;
  }
});
// Export view state management hook
var useViewState_1 = require('../hooks/useViewState');
Object.defineProperty(exports, 'useViewState', {
  enumerable: true,
  get: function () {
    return useViewState_1.useViewState;
  }
});
//# sourceMappingURL=ViewStateTools.js.map
