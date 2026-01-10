/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

/**
 * Props for the DetailSection component
 * @public
 */
export interface IDetailSectionProps {
  /** Section title */
  title: string;
  /** Section content */
  children: React.ReactNode;
  /** Optional icon to show before the title */
  icon?: React.ComponentType<{ className?: string }>;
  /** Whether the section is collapsible */
  collapsible?: boolean;
  /** Initial collapsed state (only used if collapsible) */
  defaultCollapsed?: boolean;
  /** Optional additional CSS classes */
  className?: string;
  /** Optional badge/count to show after the title */
  badge?: React.ReactNode;
}

/**
 * A collapsible section for detail views
 * @public
 */
export function DetailSection({
  title,
  children,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  icon: Icon,
  collapsible = false,
  defaultCollapsed = false,
  className = '',
  badge
}: IDetailSectionProps): React.ReactElement {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  const handleToggle = (): void => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  const headerContent = (
    <>
      {collapsible && (
        <span className="mr-1">
          {isCollapsed ? (
            <ChevronRightIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          )}
        </span>
      )}
      {Icon && <Icon className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" aria-hidden="true" />}
      <span className="font-semibold text-gray-900 dark:text-gray-100">{title}</span>
      {badge && <span className="ml-2">{badge}</span>}
    </>
  );

  return (
    <div className={`border-b border-gray-200 dark:border-gray-700 pb-4 ${className}`}>
      {collapsible ? (
        <button
          type="button"
          className="flex items-center w-full text-left py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded -mx-2 px-2 transition-colors"
          onClick={handleToggle}
          aria-expanded={!isCollapsed}
        >
          {headerContent}
        </button>
      ) : (
        <div className="flex items-center py-2">{headerContent}</div>
      )}

      {(!collapsible || !isCollapsed) && (
        <div className="mt-2 text-gray-700 dark:text-gray-300">{children}</div>
      )}
    </div>
  );
}
