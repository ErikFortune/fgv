import React from 'react';

interface IToolDefinition<TTool> {
  id: TTool;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface IAppSidebarProps<TTool> {
  selectedTool: TTool;
  onToolSelect: (tool: TTool) => void;
  tools: IToolDefinition<TTool>[];
  title?: string;
}

/**
 * Generic app sidebar component with configurable tools list
 * @public
 */
const AppSidebar = <TTool = unknown,>({
  selectedTool,
  onToolSelect,
  tools,
  title = 'Tools'
}: IAppSidebarProps<TTool>): React.ReactElement => {
  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 h-screen overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
        <nav className="space-y-2">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isSelected = selectedTool === tool.id;

            return (
              <button
                key={String(tool.id)}
                onClick={() => onToolSelect(tool.id)}
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

export default AppSidebar;
