import React from 'react';
import {
  XMarkIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface MessagesWindowProps {
  messages: any[]; // Using orchestrator messages format
  onClearMessages: () => void;
}

const getMessageIcon = (type: string) => {
  switch (type) {
    case 'info':
      return <InformationCircleIcon className="h-4 w-4 text-blue-500" />;
    case 'warning':
      return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
    case 'error':
      return <XCircleIcon className="h-4 w-4 text-red-500" />;
    case 'success':
      return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
    default:
      return <InformationCircleIcon className="h-4 w-4 text-gray-500" />;
  }
};

const getMessageColor = (type: string) => {
  switch (type) {
    case 'info':
      return 'border-blue-200 bg-blue-50';
    case 'warning':
      return 'border-yellow-200 bg-yellow-50';
    case 'error':
      return 'border-red-200 bg-red-50';
    case 'success':
      return 'border-green-200 bg-green-50';
    default:
      return 'border-gray-200 bg-gray-50';
  }
};

const MessagesWindow: React.FC<MessagesWindowProps> = ({ messages, onClearMessages }) => {
  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 bg-white">
      <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Messages ({messages.length})</h3>
        <button
          onClick={onClearMessages}
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1"
        >
          <XMarkIcon className="h-3 w-3" />
          <span>Clear</span>
        </button>
      </div>
      <div className="max-h-32 overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`px-6 py-2 border-b border-gray-100 last:border-b-0 ${getMessageColor(message.type)}`}
          >
            <div className="flex items-start space-x-2">
              {getMessageIcon(message.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">{message.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {message.timestamp
                    ? new Date(message.timestamp).toLocaleTimeString()
                    : new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MessagesWindow;
