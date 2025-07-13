import React from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

const SourceBrowser: React.FC = () => {
  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <DocumentTextIcon className="h-8 w-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Source Browser</h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Source Browser Tool</h3>
          <p className="text-gray-600 mb-6">
            This tool displays built resources in an alphabetically sorted list with detailed information.
          </p>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Coming Soon:</strong> Browse your imported resources in alphabetical order, view
              resource details, and explore fully qualified resource IDs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SourceBrowser;
