import React from 'react';
import { DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { Message } from '../../types/app';

interface ImportToolProps {
  onMessage: (type: Message['type'], message: string) => void;
}

const ImportTool: React.FC<ImportToolProps> = ({ onMessage }) => {
  const handleTestMessage = () => {
    onMessage('info', 'Test message from Import Tool');
  };

  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <DocumentArrowUpIcon className="h-8 w-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Import Resources</h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Import Resources Tool</h3>
          <p className="text-gray-600 mb-6">
            This tool allows you to import ts-res resource files and directories for processing.
          </p>
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Coming Soon:</strong> File System Access API integration, directory import, and full
              ts-res resource processing pipeline.
            </p>
          </div>
          <button
            onClick={handleTestMessage}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Test Message
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportTool;
