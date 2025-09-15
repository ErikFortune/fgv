import React from 'react';
import { RectangleStackIcon } from '@heroicons/react/24/outline';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center space-x-3">
          <RectangleStackIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">TS-RES UI Playground</h1>
            <p className="text-sm text-gray-600">
              Development and testing environment for ts-res UI components
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
