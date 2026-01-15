/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { SunIcon, MoonIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Props for the Header component
 */
export interface IHeaderProps {
  /** Click handler for settings button */
  onSettingsClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Application header with logo placeholder and theme controls
 */
export function Header({ onSettingsClick, className = '' }: IHeaderProps): React.ReactElement {
  const { resolvedTheme, toggle } = useTheme();

  return (
    <header
      className={`flex items-center justify-between px-4 py-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 ${className}`}
    >
      {/* Logo and Title */}
      <div className="flex items-center gap-3">
        {/* Logo placeholder */}
        <div className="w-14 h-14 rounded-lg bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
          <img src="/chocolate-lab-logo.png" alt="Chocolate Lab" className="w-14 h-14 object-contain" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Chocolate Lab</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Recipe & Ingredient Manager</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggle}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
          aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {resolvedTheme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
        </button>

        {/* Settings Button */}
        {onSettingsClick && (
          <button
            type="button"
            onClick={onSettingsClick}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
            aria-label="Settings"
          >
            <Cog6ToothIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </header>
  );
}
