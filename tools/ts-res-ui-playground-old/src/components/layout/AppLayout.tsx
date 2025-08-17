import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import MessagesWindow from './MessagesWindow';
import { Tool } from '../../types/app';

interface AppLayoutProps {
  children: React.ReactNode;
  selectedTool: Tool;
  onToolSelect: (tool: Tool) => void;
  messages: any[]; // Using orchestrator messages format
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

            <MessagesWindow messages={messages} onClearMessages={onClearMessages} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
