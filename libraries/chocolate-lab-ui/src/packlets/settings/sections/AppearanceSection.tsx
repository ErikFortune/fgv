/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import React from 'react';

import { useTheme } from '@fgv/ts-app-shell';
import type { Settings } from '@fgv/ts-chocolate';

import type { IPreferencesDraft } from '../useSettingsDraft';

const THEME_SWATCHES: Readonly<Record<string, ReadonlyArray<string>>> = {
  light: ['#ffffff', '#f3f4f6', '#d1d5db'],
  dark: ['#111827', '#374151', '#b8866f'],
  system: ['#ffffff', '#d1d5db', '#1f2937'],
  'dark-chocolate': ['#1b120f', '#3a2a26', '#bc845b'],
  'milk-chocolate': ['#704838', '#5f3d30', '#e1c3b1'],
  'white-chocolate': ['#fffefb', '#fdf5e8', '#b45309'],
  'caramelized-white': ['#fffaf1', '#dfc39f', '#bc845b'],
  'ruby-chocolate': ['#fff6f7', '#e6c1cc', '#b86d87']
};

function getThemeSwatches(themeId: string): ReadonlyArray<string> {
  return THEME_SWATCHES[themeId] ?? ['#e5e7eb', '#9ca3af', '#6b7280'];
}

// ============================================================================
// Props
// ============================================================================

export interface IAppearanceSectionProps {
  readonly appearance: IPreferencesDraft['appearance'];
  readonly onChange: (updates: Partial<IPreferencesDraft>) => void;
}

// ============================================================================
// AppearanceSection Component
// ============================================================================

export function AppearanceSection({ appearance, onChange }: IAppearanceSectionProps): React.ReactElement {
  const { availableThemes, theme, setTheme } = useTheme();

  function handleThemeChange(themeId: string): void {
    const asThemeId = themeId as unknown as Settings.ThemeId;
    setTheme(themeId);
    onChange({ appearance: { ...appearance, theme: asThemeId } });
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-primary mb-1">Appearance</h2>
        <p className="text-xs text-muted">Customize the look and feel of the application.</p>
      </div>

      {/* Theme Selection */}
      <div className="rounded-lg border border-border p-4 bg-surface-alt">
        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Theme</p>
        <div className="flex flex-wrap gap-3">
          {availableThemes.map((option) => {
            const isActive = (theme as string) === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={(): void => handleThemeChange(option.id)}
                className={[
                  'flex flex-col items-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors min-w-[80px]',
                  isActive
                    ? 'border-brand-accent bg-brand-accent/10 text-brand-primary'
                    : 'border-border bg-surface text-secondary hover:border-border hover:bg-hover'
                ].join(' ')}
              >
                {/* Theme preview swatch */}
                <div className="flex gap-1">
                  {getThemeSwatches(option.id).map((swatch) => (
                    <div
                      key={`${option.id}-${swatch}`}
                      className="w-4 h-4 rounded-full border border-black/10"
                      style={{ backgroundColor: swatch }}
                    />
                  ))}
                </div>
                <span className="text-xs font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted mt-3">
          {(theme as string) === 'system'
            ? 'Using your operating system preference.'
            : `Active theme: ${(theme as string).charAt(0).toUpperCase() + (theme as string).slice(1)}.`}
        </p>
      </div>
    </div>
  );
}
