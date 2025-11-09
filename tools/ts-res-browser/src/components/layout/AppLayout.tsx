import React from 'react';
import { AppLayout as BaseAppLayout } from '@fgv/ts-res-ui-components';
import Header from './Header';
import Sidebar from './Sidebar';
import { ViewStateTools } from '@fgv/ts-res-ui-components';
import { Tool } from '../../types/app';

interface AppLayoutProps {
  children: React.ReactNode;
  selectedTool: Tool;
  onToolSelect: (tool: Tool) => void;
  messages: ViewStateTools.IMessage[];
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
    <BaseAppLayout<Tool>
      selectedTool={selectedTool}
      onToolSelect={onToolSelect}
      messages={messages}
      onClearMessages={onClearMessages}
      header={Header}
      sidebar={Sidebar}
    >
      {children}
    </BaseAppLayout>
  );
};

export default AppLayout;
