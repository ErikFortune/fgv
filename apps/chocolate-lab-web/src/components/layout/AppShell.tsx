/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useState, useCallback, type ReactNode } from 'react';
import { MessagesPane } from '@fgv/ts-chocolate-ui';
import { Header } from './Header';
import { TopNavTabs } from './TopNavTabs';
import type { ToolId } from '../../types/navigation';
import { useSettings } from '../../contexts/SettingsContext';

/**
 * Props for the AppShell component
 */
export interface IAppShellProps {
  /** Currently active tool */
  activeTool: ToolId;
  /** Callback when tool selection changes */
  onToolChange: (toolId: ToolId) => void;
  /** Sidebar content (tool-specific) */
  sidebar?: ReactNode;
  /** Main content area */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Main application shell with header, tabs, sidebar, content, and messages
 */
export function AppShell({
  activeTool,
  onToolChange,
  sidebar,
  children,
  className = ''
}: IAppShellProps): React.ReactElement {
  const { settings, toggleSidebarCollapsed } = useSettings();
  const [showSettings, setShowSettings] = useState(false);

  const sidebarCollapsed = settings.sidebarCollapsed[activeTool] ?? false;

  const handleSettingsClick = useCallback(() => {
    // Navigate to settings tool
    onToolChange('settings');
  }, [onToolChange]);

  const handleToggleSidebar = useCallback(() => {
    toggleSidebarCollapsed(activeTool);
  }, [activeTool, toggleSidebarCollapsed]);

  return (
    <div className={`flex flex-col h-screen bg-gray-100 dark:bg-gray-950 ${className}`}>
      {/* Header */}
      <Header onSettingsClick={handleSettingsClick} />

      {/* Top Navigation */}
      <TopNavTabs activeTool={activeTool} onToolSelect={onToolChange} />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebar && (
          <aside
            className={`
              flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
              transition-all duration-200 overflow-hidden
              ${sidebarCollapsed ? 'w-0' : 'w-64'}
            `}
          >
            <div className="h-full overflow-y-auto p-4">{sidebar}</div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
      </div>

      {/* Messages Pane */}
      <MessagesPane visible={settings.showMessagesPane} defaultCollapsed={true} />
    </div>
  );
}

/**
 * Tool sidebar wrapper with collapse toggle
 */
export interface IToolSidebarProps {
  /** Sidebar title */
  title: string;
  /** Sidebar content */
  children: ReactNode;
  /** Tool ID for collapsed state tracking */
  toolId: ToolId;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Wrapper component for tool sidebars
 */
export function ToolSidebar({
  title,
  children,
  toolId,
  className = ''
}: IToolSidebarProps): React.ReactElement {
  const { settings, toggleSidebarCollapsed } = useSettings();
  const isCollapsed = settings.sidebarCollapsed[toolId] ?? false;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}
