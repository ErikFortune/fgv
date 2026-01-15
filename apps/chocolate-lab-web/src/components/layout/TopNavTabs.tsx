/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import type { ToolId } from '../../types/navigation';
import { TOOLS } from '../../types/navigation';
import {
  BeakerIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  CubeIcon,
  SparklesIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

/**
 * Props for the TopNavTabs component
 */
export interface ITopNavTabsProps {
  /** Currently active tool */
  activeTool: ToolId;
  /** Callback when a tool is selected */
  onToolSelect: (toolId: ToolId) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get icon component for a tool
 */
function getToolIcon(toolId: ToolId): React.ReactNode {
  const iconClass = 'w-5 h-5';
  switch (toolId) {
    case 'ingredients':
      return <BeakerIcon className={iconClass} />;
    case 'fillings':
      return <BookOpenIcon className={iconClass} />;
    case 'tasks':
      return <ClipboardDocumentListIcon className={iconClass} />;
    case 'procedures':
      return <BookOpenIcon className={iconClass} />;
    case 'molds':
      return <CubeIcon className={iconClass} />;
    case 'confections':
      return <SparklesIcon className={iconClass} />;
    case 'settings':
      return <Cog6ToothIcon className={iconClass} />;
    default:
      return null;
  }
}

/**
 * Horizontal navigation tabs for tool selection
 */
export function TopNavTabs({
  activeTool,
  onToolSelect,
  className = ''
}: ITopNavTabsProps): React.ReactElement {
  const enabledTools = TOOLS.filter((tool) => tool.enabled);

  return (
    <nav
      className={`flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 ${className}`}
      aria-label="Main navigation"
    >
      <div className="flex gap-1 px-4">
        {enabledTools.map((tool) => {
          const isActive = tool.id === activeTool;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onToolSelect(tool.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors
                ${
                  isActive
                    ? 'border-chocolate-600 text-chocolate-600 dark:border-chocolate-400 dark:text-chocolate-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              {getToolIcon(tool.id)}
              <span>{tool.name}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
