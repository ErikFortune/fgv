/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  XMarkIcon,
  FunnelIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  BugAntIcon
} from '@heroicons/react/24/outline';
import { useMessages, type MessageType } from './ObservabilityContext';

/**
 * Props for the MessagesPane component
 * @public
 */
export interface IMessagesPaneProps {
  /** Whether the pane is visible */
  visible?: boolean;
  /** Initial collapsed state */
  defaultCollapsed?: boolean;
  /** Maximum height when expanded (CSS value) */
  maxHeight?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get icon for message type
 * @internal
 */
function getMessageIcon(type: MessageType): React.ReactNode {
  const baseClass = 'w-4 h-4 flex-shrink-0';
  switch (type) {
    case 'success':
      return <CheckCircleIcon className={`${baseClass} text-green-500`} />;
    case 'error':
      return <ExclamationCircleIcon className={`${baseClass} text-red-500`} />;
    case 'warning':
      return <ExclamationTriangleIcon className={`${baseClass} text-yellow-500`} />;
    case 'info':
      return <InformationCircleIcon className={`${baseClass} text-blue-500`} />;
    case 'debug':
      return <BugAntIcon className={`${baseClass} text-gray-400`} />;
    default:
      return <InformationCircleIcon className={`${baseClass} text-gray-500`} />;
  }
}

/**
 * Format timestamp for display
 * @internal
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Collapsible message pane for observability
 * @public
 */
export function MessagesPane({
  visible = true,
  defaultCollapsed = false,
  maxHeight = '200px',
  className = ''
}: IMessagesPaneProps): React.ReactElement | null {
  const { messages, clearMessages, messageCounts } = useMessages();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [filter, setFilter] = useState<MessageType | 'all'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!collapsed && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, collapsed]);

  if (!visible) {
    return null;
  }

  const filteredMessages = filter === 'all' ? messages : messages.filter((m) => m.type === filter);

  const totalCount = messages.length;
  const errorCount = messageCounts.error;
  const warningCount = messageCounts.warning;

  return (
    <div className={`border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
        >
          {collapsed ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
          <span>Messages</span>
          <span className="text-gray-400 dark:text-gray-500">({totalCount})</span>
          {errorCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs rounded bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
              {errorCount} error{errorCount !== 1 ? 's' : ''}
            </span>
          )}
          {warningCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
              {warningCount} warning{warningCount !== 1 ? 's' : ''}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 ${
                filter !== 'all' ? 'text-chocolate-600 dark:text-chocolate-400' : ''
              }`}
              aria-label="Filter messages"
            >
              <FunnelIcon className="w-4 h-4" />
            </button>

            {showFilterMenu && (
              <div className="absolute right-0 mt-1 py-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                {(['all', 'success', 'error', 'warning', 'info', 'debug'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setFilter(type);
                      setShowFilterMenu(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      filter === type
                        ? 'text-chocolate-600 dark:text-chocolate-400'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                    {type !== 'all' && messageCounts[type] > 0 && (
                      <span className="ml-2 text-gray-400">({messageCounts[type]})</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clear */}
          <button
            type="button"
            onClick={clearMessages}
            className="p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
            aria-label="Clear messages"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages List */}
      {!collapsed && (
        <div className="overflow-y-auto px-4 py-2 space-y-1" style={{ maxHeight }}>
          {filteredMessages.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No messages</p>
          ) : (
            filteredMessages.map((message) => (
              <div key={message.id} className="flex items-start gap-2 text-sm py-1">
                {getMessageIcon(message.type)}
                <span className="text-gray-400 dark:text-gray-500 text-xs font-mono">
                  {formatTime(message.timestamp)}
                </span>
                {message.source && (
                  <span className="text-gray-400 dark:text-gray-500 text-xs">[{message.source}]</span>
                )}
                <span className="text-gray-700 dark:text-gray-300 break-words">{message.text}</span>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}
