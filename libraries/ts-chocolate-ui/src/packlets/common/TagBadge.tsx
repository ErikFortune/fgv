/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { TagIcon, XMarkIcon } from '@heroicons/react/24/outline';

/* eslint-disable @rushstack/typedef-var */

/**
 * Props for the TagBadge component
 * @public
 */
export interface ITagBadgeProps {
  /** Tag text to display */
  tag: string;
  /** Optional additional CSS classes */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Click handler for selecting the tag */
  onClick?: () => void;
  /** Handler for removing the tag (shows X button) */
  onRemove?: () => void;
  /** Whether the tag is currently selected/active */
  isActive?: boolean;
}

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-0.5',
  lg: 'text-base px-2.5 py-1'
};

const iconSizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4'
};

/**
 * Displays a tag as an interactive badge
 * @public
 */
export function TagBadge({
  tag,
  className = '',
  size = 'md',
  onClick,
  onRemove,
  isActive = false
}: ITagBadgeProps): React.ReactElement {
  const isClickable = onClick !== undefined;

  const baseClasses = `inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]}`;

  const colorClasses = isActive
    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
    : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';

  const interactiveClasses = isClickable
    ? 'cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors'
    : '';

  const combinedClasses = `${baseClasses} ${colorClasses} ${interactiveClasses} ${className}`;

  const handleClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    onClick?.();
  };

  const handleRemove = (e: React.MouseEvent): void => {
    e.stopPropagation();
    onRemove?.();
  };

  const tagContent = (
    <>
      <TagIcon className={iconSizeClasses[size]} aria-hidden="true" />
      <span>{tag}</span>
      {onRemove && (
        <button
          type="button"
          className="ml-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 p-0.5"
          onClick={handleRemove}
          aria-label={`Remove ${tag} tag`}
        >
          <XMarkIcon className={iconSizeClasses[size]} aria-hidden="true" />
        </button>
      )}
    </>
  );

  if (isClickable) {
    return (
      <button type="button" className={combinedClasses} onClick={handleClick} title={tag}>
        {tagContent}
      </button>
    );
  }

  return (
    <span className={combinedClasses} title={tag}>
      {tagContent}
    </span>
  );
}
