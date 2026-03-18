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
                  {option.id === 'light' && (
                    <>
                      <div className="w-4 h-4 rounded-full bg-white border border-gray-200" />
                      <div className="w-4 h-4 rounded-full bg-gray-100" />
                    </>
                  )}
                  {option.id === 'dark' && (
                    <>
                      <div className="w-4 h-4 rounded-full bg-gray-800" />
                      <div className="w-4 h-4 rounded-full bg-gray-700" />
                    </>
                  )}
                  {option.id === 'system' && (
                    <>
                      <div className="w-4 h-4 rounded-full bg-white border border-gray-200" />
                      <div className="w-4 h-4 rounded-full bg-gray-800" />
                    </>
                  )}
                  {option.id !== 'light' && option.id !== 'dark' && option.id !== 'system' && (
                    <div className="w-4 h-4 rounded-full bg-brand-accent" />
                  )}
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
