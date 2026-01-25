/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import type { ConfectionType } from '@fgv/ts-chocolate';

/**
 * Props for the ConfectionTypeBadge component
 * @public
 */
export interface IConfectionTypeBadgeProps {
  /** Confection type to display */
  confectionType: ConfectionType;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Color configurations for each confection type
 * @internal
 */
const confectionTypeColors: Record<
  ConfectionType,
  { bg: string; text: string; darkBg: string; darkText: string }
> = {
  'molded-bonbon': {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    darkBg: 'dark:bg-purple-900/30',
    darkText: 'dark:text-purple-300'
  },
  'bar-truffle': {
    bg: 'bg-rose-100',
    text: 'text-rose-800',
    darkBg: 'dark:bg-rose-900/30',
    darkText: 'dark:text-rose-300'
  },
  'rolled-truffle': {
    bg: 'bg-teal-100',
    text: 'text-teal-800',
    darkBg: 'dark:bg-teal-900/30',
    darkText: 'dark:text-teal-300'
  }
};

/**
 * Size configurations
 * @internal
 */
const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5'
};

/**
 * Display labels for confection types
 * @internal
 */
const confectionTypeLabels: Record<ConfectionType, string> = {
  'molded-bonbon': 'Molded Bonbon',
  'bar-truffle': 'Bar Truffle',
  'rolled-truffle': 'Rolled Truffle'
};

/**
 * Badge displaying a confection type with appropriate styling
 * @public
 */
export function ConfectionTypeBadge({
  confectionType,
  size = 'md',
  className = ''
}: IConfectionTypeBadgeProps): React.ReactElement {
  const colors = confectionTypeColors[confectionType];
  const sizeClass = sizeClasses[size];
  const label = confectionTypeLabels[confectionType];

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium
        ${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText}
        ${sizeClass}
        ${className}
      `}
    >
      {label}
    </span>
  );
}
