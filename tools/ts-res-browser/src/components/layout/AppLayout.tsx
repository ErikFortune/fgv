import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { ViewTools } from '@fgv/ts-res-ui-components';
import { Tool } from '../../types/app';

interface AppLayoutProps {
  children: React.ReactNode;
  selectedTool: Tool;
  onToolSelect: (tool: Tool) => void;
  messages: ViewTools.Message[];
  onClearMessages: () => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  selectedTool,
  onToolSelect,
  messages,
  onClearMessages
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="flex">
        <Sidebar selectedTool={selectedTool} onToolSelect={onToolSelect} />

        <main className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-auto">{children}</div>

            <ViewTools.MessagesWindow messages={messages} onClearMessages={onClearMessages} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
