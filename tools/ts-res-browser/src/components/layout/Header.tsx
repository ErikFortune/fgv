import React from 'react';
import { DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center space-x-3">
          <DocumentMagnifyingGlassIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">TS-RES Browser</h1>
            <p className="text-sm text-gray-600">
              Visual tool for loading, browsing, and experimenting with ts-res resources
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
