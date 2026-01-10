/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { FolderIcon, LockClosedIcon } from '@heroicons/react/24/outline';
/* eslint-disable @rushstack/typedef-var */

/**
 * Props for the CollectionBadge component
 * @public
 */
export interface ICollectionBadgeProps {
  /** Collection name or ID to display */
  name: string;
  /** Whether the collection is protected/encrypted */
  isProtected?: boolean;
  /** Whether the collection is currently locked (not decrypted) */
  isLocked?: boolean;
  /** Optional additional CSS classes */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Click handler */
  onClick?: () => void;
}

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-1',
  lg: 'text-base px-3 py-1.5'
};

const iconSizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5'
};

/**
 * Displays a collection identifier as a styled badge with optional lock indicator
 * @public
 */
export function CollectionBadge({
  name,
  isProtected = false,
  isLocked = false,
  className = '',
  size = 'md',
  onClick
}: ICollectionBadgeProps): React.ReactElement {
  const isClickable = onClick !== undefined;
  const showLock = isProtected && isLocked;

  const baseClasses = `inline-flex items-center gap-1 rounded font-medium ${sizeClasses[size]} bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300`;

  const interactiveClasses = isClickable
    ? 'cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'
    : '';

  const lockClasses = showLock ? 'opacity-75' : '';

  const combinedClasses = `${baseClasses} ${interactiveClasses} ${lockClasses} ${className}`;

  const content = (
    <>
      {showLock ? (
        <LockClosedIcon className={iconSizeClasses[size]} aria-hidden="true" />
      ) : (
        <FolderIcon className={iconSizeClasses[size]} aria-hidden="true" />
      )}
      <span className={showLock ? 'italic' : ''}>{name}</span>
    </>
  );

  if (isClickable) {
    return (
      <button
        type="button"
        className={combinedClasses}
        onClick={onClick}
        title={showLock ? `${name} (locked)` : name}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={combinedClasses} title={showLock ? `${name} (locked)` : name}>
      {content}
    </span>
  );
}
