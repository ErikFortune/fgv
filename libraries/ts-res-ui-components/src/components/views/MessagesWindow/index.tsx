import React, { useState, useMemo } from 'react';
import {
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  FunnelIcon,
  DocumentDuplicateIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';

/**
 * Message type definition for the MessagesWindow component.
 *
 * Extends the basic message structure with additional properties for enhanced
 * message management and display.
 *
 * @public
 */
export interface Message {
  /** Unique identifier for the message */
  id: string;
  /** Message type determining visual styling and filtering */
  type: 'info' | 'warning' | 'error' | 'success';
  /** The message content to display */
  message: string;
  /** Timestamp when the message was created */
  timestamp: Date;
}

/**
 * Props for the MessagesWindow component.
 *
 * @public
 */
export interface MessagesWindowProps {
  /** Array of messages to display */
  messages: Message[];
  /** Callback fired when the user requests to clear all messages */
  onClearMessages: () => void;
  /** Optional CSS class name for the container */
  className?: string;
}

/**
 * MessagesWindow component for displaying and managing application messages.
 *
 * Provides a comprehensive interface for displaying, filtering, and managing
 * application messages with advanced features like search, filtering by type,
 * and copy functionality. Designed for use in development tools and debugging
 * interfaces where message visibility and management are critical.
 *
 * **Key Features:**
 * - **Message filtering**: Filter messages by type (info, warning, error, success)
 * - **Search functionality**: Full-text search across message content
 * - **Copy functionality**: Copy all filtered messages to clipboard
 * - **Collapsible interface**: Minimize/maximize the message window
 * - **Message count display**: Shows filtered vs total message counts
 * - **Timestamp formatting**: Human-readable timestamp display
 * - **Visual indicators**: Color-coded message types with appropriate icons
 * - **Auto-hide when empty**: Component hides automatically when no messages exist
 *
 * @example
 * ```typescript
 * import { MessagesWindow, Message } from '@fgv/ts-res-ui-components';
 *
 * function MyApplication() {
 *   const [messages, setMessages] = useState<Message[]>([]);
 *
 *   const addMessage = (type: Message['type'], text: string) => {
 *     const newMessage: Message = {
 *       id: `msg-${Date.now()}-${Math.random()}`,
 *       type,
 *       message: text,
 *       timestamp: new Date()
 *     };
 *     setMessages(prev => [...prev, newMessage]);
 *   };
 *
 *   const clearMessages = () => {
 *     setMessages([]);
 *   };
 *
 *   // Create component with button controls and messages window
 *   return React.createElement('div', {},
 *     React.createElement('div', { className: 'space-x-2 mb-4' },
 *       React.createElement('button',
 *         { onClick: () => addMessage('info', 'Processing started') },
 *         'Add Info'
 *       ),
 *       React.createElement('button',
 *         { onClick: () => addMessage('success', 'Operation completed') },
 *         'Add Success'
 *       )
 *     ),
 *     React.createElement(MessagesWindow, {
 *       messages,
 *       onClearMessages: clearMessages
 *     })
 *   );
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Integration with view state management
 * import { ViewStateTools } from '@fgv/ts-res-ui-components';
 *
 * function MyTool() {
 *   const [viewState, setViewState] = useState({
 *     messages: [] as ViewStateTools.Message[]
 *   });
 *
 *   const onMessage = (type: ViewStateTools.Message['type'], message: string) => {
 *     setViewState(prev => ({
 *       ...prev,
 *       messages: [...prev.messages, {
 *         id: `msg-${Date.now()}`,
 *         type,
 *         message,
 *         timestamp: new Date()
 *       }]
 *     }));
 *   };
 *
 *   return React.createElement('div', { className: 'flex flex-col h-screen' },
 *     React.createElement('div', { className: 'flex-1' }),
 *     React.createElement(ViewStateTools.MessagesWindow, {
 *       messages: viewState.messages,
 *       onClearMessages: () => setViewState(prev => ({ ...prev, messages: [] }))
 *     })
 *   );
 * }
 * ```
 *
 * @public
 */
export const MessagesWindow: React.FC<MessagesWindowProps> = ({
  messages,
  onClearMessages,
  className = ''
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [filter, setFilter] = useState<Message['type'] | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Filter and search messages
  const filteredMessages = useMemo(() => {
    return messages.filter((message) => {
      const matchesFilter = filter === 'all' || message.type === filter;
      const matchesSearch =
        searchTerm === '' || message.message.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [messages, filter, searchTerm]);

  const copyAllMessages = () => {
    const messageText = filteredMessages
      .map((msg) => `[${msg.type.toUpperCase()}] ${formatTime(msg.timestamp)} - ${msg.message}`)
      .join('\n');

    navigator.clipboard
      .writeText(messageText)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy messages:', err);
      });
  };

  if (messages.length === 0) {
    return null;
  }

  const getMessageIcon = (type: Message['type']) => {
    switch (type) {
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getMessageBgColor = (type: Message['type']) => {
    switch (type) {
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className={`border-t border-gray-200 bg-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 hover:bg-gray-200 rounded">
            {isCollapsed ? (
              <ChevronUpIcon className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
            )}
          </button>
          <h3 className="text-sm font-medium text-gray-900">
            Messages ({filteredMessages.length}
            {messages.length !== filteredMessages.length ? ` of ${messages.length}` : ''})
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-1 hover:bg-gray-200 rounded"
            title="Filter messages"
          >
            <FunnelIcon className="h-4 w-4 text-gray-500" />
          </button>
          <button
            onClick={copyAllMessages}
            className={`p-1 rounded transition-colors ${
              copySuccess ? 'bg-green-100 hover:bg-green-200' : 'hover:bg-gray-200'
            }`}
            title={copySuccess ? 'Copied!' : 'Copy filtered messages'}
          >
            {copySuccess ? (
              <CheckIcon className="h-4 w-4 text-green-600" />
            ) : (
              <DocumentDuplicateIcon className="h-4 w-4 text-gray-500" />
            )}
          </button>
          <button
            onClick={onClearMessages}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Filters */}
      {!isCollapsed && showFilters && (
        <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 space-y-2">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filter buttons */}
          <div className="flex flex-wrap gap-1">
            {(['all', 'info', 'success', 'warning', 'error'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`text-xs px-2 py-1 rounded-md border ${
                  filter === type
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                {type !== 'all' && ` (${messages.filter((m) => m.type === type).length})`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {!isCollapsed && (
        <div className="max-h-48 overflow-y-auto">
          {filteredMessages.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              {searchTerm || filter !== 'all' ? 'No messages match the current filter' : 'No messages'}
            </div>
          ) : (
            filteredMessages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 p-3 border-l-4 ${getMessageBgColor(message.type)}`}
              >
                {getMessageIcon(message.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{message.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatTime(message.timestamp)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MessagesWindow;
