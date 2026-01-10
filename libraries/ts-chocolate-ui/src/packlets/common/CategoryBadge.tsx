/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import {
  BeakerIcon,
  CubeIcon,
  SparklesIcon,
  FireIcon,
  CloudIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import type { IngredientCategory } from '@fgv/ts-chocolate';
/* eslint-disable @rushstack/typedef-var */

/**
 * Props for the CategoryBadge component
 * @public
 */
export interface ICategoryBadgeProps {
  /** The ingredient category to display */
  category: IngredientCategory;
  /** Optional additional CSS classes */
  className?: string;
  /** Whether to show only the icon without text */
  iconOnly?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Category display configuration
 */
interface ICategoryConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  textColor: string;
  darkBgColor: string;
  darkTextColor: string;
}

const categoryConfigs: Record<IngredientCategory, ICategoryConfig> = {
  chocolate: {
    label: 'Chocolate',
    icon: CubeIcon,
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-800',
    darkBgColor: 'dark:bg-amber-900',
    darkTextColor: 'dark:text-amber-200'
  },
  sugar: {
    label: 'Sugar',
    icon: SparklesIcon,
    bgColor: 'bg-pink-100',
    textColor: 'text-pink-800',
    darkBgColor: 'dark:bg-pink-900',
    darkTextColor: 'dark:text-pink-200'
  },
  dairy: {
    label: 'Dairy',
    icon: CloudIcon,
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    darkBgColor: 'dark:bg-blue-900',
    darkTextColor: 'dark:text-blue-200'
  },
  fat: {
    label: 'Fat',
    icon: FireIcon,
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    darkBgColor: 'dark:bg-yellow-900',
    darkTextColor: 'dark:text-yellow-200'
  },
  liquid: {
    label: 'Liquid',
    icon: BeakerIcon,
    bgColor: 'bg-cyan-100',
    textColor: 'text-cyan-800',
    darkBgColor: 'dark:bg-cyan-900',
    darkTextColor: 'dark:text-cyan-200'
  },
  flavor: {
    label: 'Flavor',
    icon: SparklesIcon,
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    darkBgColor: 'dark:bg-purple-900',
    darkTextColor: 'dark:text-purple-200'
  },
  alcohol: {
    label: 'Alcohol',
    icon: BeakerIcon,
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    darkBgColor: 'dark:bg-red-900',
    darkTextColor: 'dark:text-red-200'
  },
  other: {
    label: 'Other',
    icon: AdjustmentsHorizontalIcon,
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    darkBgColor: 'dark:bg-gray-700',
    darkTextColor: 'dark:text-gray-200'
  }
};

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
 * Displays an ingredient category as a styled badge with icon
 * @public
 */
export function CategoryBadge({
  category,
  className = '',
  iconOnly = false,
  size = 'md'
}: ICategoryBadgeProps): React.ReactElement {
  const config = categoryConfigs[category];
  const Icon = config.icon;

  const baseClasses = `inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]} ${config.bgColor} ${config.textColor} ${config.darkBgColor} ${config.darkTextColor}`;

  return (
    <span className={`${baseClasses} ${className}`} title={config.label}>
      <Icon className={iconSizeClasses[size]} aria-hidden="true" />
      {!iconOnly && <span>{config.label}</span>}
    </span>
  );
}
