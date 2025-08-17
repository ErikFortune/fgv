import React from 'react';
import { DocumentArrowUpIcon, CogIcon, RectangleStackIcon } from '@heroicons/react/24/outline';
import { Tool } from '../../types/app';

interface SidebarProps {
  selectedTool: Tool;
  onToolSelect: (tool: Tool) => void;
}

const tools = [
  {
    id: 'configuration',
    name: 'Configuration',
    icon: CogIcon,
    description: 'Select predefined configurations and set up system parameters'
  },
  {
    id: 'import',
    name: 'Import Resources',
    icon: DocumentArrowUpIcon,
    description: 'Import resource files, directories, and ZIP archives'
  },
  {
    id: 'picker',
    name: 'Resource Picker',
    icon: RectangleStackIcon,
    description: 'Interactive ResourcePicker component demo and testing'
  }
];

const Sidebar: React.FC<SidebarProps> = ({ selectedTool, onToolSelect }) => {
  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 h-screen overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Components</h2>
        <nav className="space-y-2">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isSelected = selectedTool === tool.id;

            return (
              <button
                key={tool.id}
                onClick={() => onToolSelect(tool.id as Tool)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'hover:bg-gray-50 text-gray-700 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm">{tool.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{tool.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
