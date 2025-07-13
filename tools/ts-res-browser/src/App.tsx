import React from 'react';
import { DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="text-center">
          <DocumentMagnifyingGlassIcon className="h-24 w-24 text-res-primary mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">TS-RES Browser</h1>
          <p className="text-lg text-gray-600 mb-8 max-w-md">
            A visual tool for loading, browsing, and experimenting with ts-res resources.
          </p>
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Getting Started</h2>
            <p className="text-gray-600 mb-4">
              Import your ts-res project files to begin exploring resources.
            </p>
            <button className="w-full bg-res-primary text-white font-medium py-2 px-4 rounded-md hover:bg-res-secondary transition-colors">
              Import Files
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
