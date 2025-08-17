import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">ts-res UI Components Playground</h1>
          <span className="text-sm text-gray-500">Interactive component testing environment</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
