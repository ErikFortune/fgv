import React from 'react';
import { ViewStateTools } from '../../namespaces';

interface IAppLayoutProps<TTool = unknown> {
  children: React.ReactNode;
  selectedTool: TTool;
  onToolSelect: (tool: TTool) => void;
  messages: ViewStateTools.IMessage[];
  onClearMessages: () => void;
  header: React.ComponentType;
  sidebar: React.ComponentType<{
    selectedTool: TTool;
    onToolSelect: (tool: TTool) => void;
  }>;
}

/**
 * Generic app layout component with header, sidebar, main content area, and messages window
 * @public
 */
const AppLayout = <TTool = unknown,>({
  children,
  selectedTool,
  onToolSelect,
  messages,
  onClearMessages,
  header: headerComponent,
  sidebar: sidebarComponent
}: IAppLayoutProps<TTool>): React.ReactElement => {
  const Header = headerComponent;
  const Sidebar = sidebarComponent;
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="flex">
        <Sidebar selectedTool={selectedTool} onToolSelect={onToolSelect} />

        <main className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-auto">{children}</div>

            <ViewStateTools.MessagesWindow messages={messages} onClearMessages={onClearMessages} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
