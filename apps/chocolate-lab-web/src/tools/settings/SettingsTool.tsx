/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useTheme, type ThemeMode } from '../../contexts/ThemeContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useChocolate } from '../../contexts/ChocolateContext';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

/**
 * Settings tool for app configuration
 */
export function SettingsTool(): React.ReactElement {
  const { mode, setMode, resolvedTheme } = useTheme();
  const { settings, updateSetting } = useSettings();
  const { ingredientCount, recipeCount, moldCount, confectionCount } = useChocolate();

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>

      {/* Appearance */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Appearance</h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Theme</label>
          <div className="flex gap-2">
            {(
              [
                { value: 'light', icon: SunIcon, label: 'Light' },
                { value: 'dark', icon: MoonIcon, label: 'Dark' },
                { value: 'system', icon: ComputerDesktopIcon, label: 'System' }
              ] as const
            ).map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  mode === value
                    ? 'border-chocolate-500 bg-chocolate-50 text-chocolate-700 dark:border-chocolate-400 dark:bg-chocolate-900/20 dark:text-chocolate-300'
                    : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Display */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Display</h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Show collection badges in browse views
            </span>
            <input
              type="checkbox"
              checked={settings.showCollectionBadges}
              onChange={(e) => updateSetting('showCollectionBadges', e.target.checked)}
              className="w-4 h-4 text-chocolate-600 rounded focus:ring-chocolate-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">Show messages pane</span>
            <input
              type="checkbox"
              checked={settings.showMessagesPane}
              onChange={(e) => updateSetting('showMessagesPane', e.target.checked)}
              className="w-4 h-4 text-chocolate-600 rounded focus:ring-chocolate-500"
            />
          </label>
        </div>
      </section>

      {/* Library Stats */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Library Statistics</h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Ingredients</dt>
              <dd className="text-2xl font-bold text-gray-900 dark:text-gray-100">{ingredientCount}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Recipes</dt>
              <dd className="text-2xl font-bold text-gray-900 dark:text-gray-100">{recipeCount}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Molds</dt>
              <dd className="text-2xl font-bold text-gray-900 dark:text-gray-100">{moldCount}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Confections</dt>
              <dd className="text-2xl font-bold text-gray-900 dark:text-gray-100">{confectionCount}</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* About */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">About</h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            <strong>Chocolate Lab</strong> - Recipe & Ingredient Manager
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Built with @fgv/ts-chocolate and React</p>
        </div>
      </section>
    </div>
  );
}
