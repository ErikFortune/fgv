/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import type { Recipes } from '@fgv/ts-chocolate';

/**
 * Props for the RecipeCategoryBadge component
 * @public
 */
export interface IRecipeCategoryBadgeProps {
  /** Recipe category to display */
  category: Recipes.RecipeCategory;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Color configurations for each recipe category
 * @internal
 */
const categoryColors: Record<
  Recipes.RecipeCategory,
  { bg: string; text: string; darkBg: string; darkText: string }
> = {
  ganache: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    darkBg: 'dark:bg-amber-900/30',
    darkText: 'dark:text-amber-300'
  },
  caramel: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    darkBg: 'dark:bg-orange-900/30',
    darkText: 'dark:text-orange-300'
  },
  gianduja: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    darkBg: 'dark:bg-yellow-900/30',
    darkText: 'dark:text-yellow-300'
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
 * Display labels for recipe categories
 * @internal
 */
const categoryLabels: Record<Recipes.RecipeCategory, string> = {
  ganache: 'Ganache',
  caramel: 'Caramel',
  gianduja: 'Gianduja'
};

/**
 * Badge displaying a recipe category with appropriate styling
 * @public
 */
export function RecipeCategoryBadge({
  category,
  size = 'md',
  className = ''
}: IRecipeCategoryBadgeProps): React.ReactElement {
  const colors = categoryColors[category];
  const sizeClass = sizeClasses[size];
  const label = categoryLabels[category];

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
