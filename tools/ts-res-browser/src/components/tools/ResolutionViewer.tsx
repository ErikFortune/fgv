import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const ResolutionViewer: React.FC = () => {
  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <MagnifyingGlassIcon className="h-8 w-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Resolution Viewer</h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Resource Resolution Viewer</h3>
          <p className="text-gray-600 mb-6">
            This tool allows you to view resource resolution with qualifier input and candidate displays.
          </p>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Coming Soon:</strong> Input qualifiers, select resources, and view resolution candidates
              with "best candidate" and "all candidates" options.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResolutionViewer;
