import React from 'react';

interface IAppHeaderProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

/**
 * Generic app header component with configurable icon, title, and description
 * @public
 */
const AppHeader: React.FC<IAppHeaderProps> = ({ icon: iconComponent, title, description }) => {
  const Icon = iconComponent;
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center space-x-3">
          <Icon className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
