import React, { useState } from 'react';
import {
  XMarkIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

interface Message {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: Date;
}

interface MessagesWindowProps {
  messages: Message[];
  onClearMessages: () => void;
}

const MessagesWindow: React.FC<MessagesWindowProps> = ({ messages, onClearMessages }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

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
    <div className="border-t border-gray-200 bg-white">
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
          <h3 className="text-sm font-medium text-gray-900">Messages ({messages.length})</h3>
        </div>
        <button
          onClick={onClearMessages}
          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
        >
          Clear All
        </button>
      </div>

      {/* Messages */}
      {!isCollapsed && (
        <div className="max-h-48 overflow-y-auto">
          {messages.map((message) => (
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
          ))}
        </div>
      )}
    </div>
  );
};

export default MessagesWindow;
