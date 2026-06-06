// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * A theme identifier string. Built-in values are 'light', 'dark', and 'system'.
 * Custom themes use arbitrary strings that map to CSS classes (e.g., 'ocean' maps to '.theme-ocean').
 * @public
 */
export type ThemeId = string;

/**
 * Describes an available theme for display in selectors.
 * @public
 */
export interface IThemeOption {
  /** Theme identifier used in settings and CSS class mapping */
  readonly id: ThemeId;
  /** Human-readable label for display */
  readonly label: string;
}

/**
 * Value exposed by ThemeContext.
 * @public
 */
export interface IThemeContext {
  /** The currently active theme ID */
  readonly theme: ThemeId;
  /** Whether the resolved (effective) appearance is dark */
  readonly isDark: boolean;
  /** Set the active theme */
  readonly setTheme: (theme: ThemeId) => void;
  /** All available theme options */
  readonly availableThemes: ReadonlyArray<IThemeOption>;
}

/**
 * Default built-in themes.
 */
const BUILT_IN_THEMES: ReadonlyArray<IThemeOption> = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' }
];

const ThemeContext: React.Context<IThemeContext | undefined> = createContext<IThemeContext | undefined>(
  undefined
);

/**
 * Maps a theme ID to the CSS class applied to the document element.
 * - 'light': no class (uses :root defaults)
 * - 'dark': 'dark' class
 * - 'system': 'system-theme' class (uses prefers-color-scheme media query)
 * - custom: 'theme-\{id\}' class
 */
function themeIdToCssClass(id: ThemeId): string | undefined {
  switch (id) {
    case 'light':
      return undefined;
    case 'dark':
      return 'dark';
    case 'system':
      return 'system-theme';
    default:
      return `theme-${id}`;
  }
}

/**
 * Determines whether the effective appearance is dark.
 */
function resolveIsDark(themeId: ThemeId): boolean {
  if (themeId === 'dark') {
    return true;
  }
  if (themeId === 'system' && typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
}

/**
 * All CSS classes that ThemeProvider may apply.
 * Used to cleanly remove the previous theme before applying a new one.
 */
const MANAGED_CLASSES: ReadonlyArray<string> = ['dark', 'system-theme'];

/**
 * Props for {@link ThemeProvider}.
 * @public
 */
export interface IThemeProviderProps {
  /** Initial theme ID (typically from persisted settings). Defaults to 'light'. */
  readonly initialTheme?: ThemeId;
  /** Additional custom themes beyond the built-in light/dark/system. */
  readonly customThemes?: ReadonlyArray<IThemeOption>;
  /** Called when the user changes the theme. Use this to persist the choice. */
  readonly onThemeChange?: (theme: ThemeId) => void;
  /** Children */
  readonly children: React.ReactNode;
}

/**
 * Provides theme context to the application and manages the CSS class on `<html>`.
 *
 * Wrap your app (or a subtree) with this provider. Components use {@link useTheme}
 * to read or change the active theme.
 *
 * @example
 * ```tsx
 * <ThemeProvider initialTheme={settings.appearance?.theme} onThemeChange={saveTheme}>
 *   <App />
 * </ThemeProvider>
 * ```
 * @public
 */
export function ThemeProvider({
  initialTheme = 'light',
  customThemes,
  onThemeChange,
  children
}: IThemeProviderProps): React.JSX.Element {
  const [theme, setThemeState] = useState<ThemeId>(initialTheme);
  const [isDark, setIsDark] = useState(() => resolveIsDark(initialTheme));

  const availableThemes = useMemo<ReadonlyArray<IThemeOption>>(() => {
    if (!customThemes || customThemes.length === 0) {
      return BUILT_IN_THEMES;
    }
    return [...BUILT_IN_THEMES, ...customThemes];
  }, [customThemes]);

  const setTheme = useCallback(
    (newTheme: ThemeId) => {
      setThemeState(newTheme);
      onThemeChange?.(newTheme);
    },
    [onThemeChange]
  );

  // Apply CSS class to document element when theme changes
  useEffect(() => {
    const root = document.documentElement;

    // Remove all managed theme classes
    for (const cls of MANAGED_CLASSES) {
      root.classList.remove(cls);
    }
    // Also remove any custom theme classes
    for (const cls of Array.from(root.classList)) {
      if (cls.startsWith('theme-')) {
        root.classList.remove(cls);
      }
    }

    // Apply new theme class
    const cssClass = themeIdToCssClass(theme);
    if (cssClass) {
      root.classList.add(cssClass);
    }

    setIsDark(resolveIsDark(theme));
  }, [theme]);

  // Listen for OS preference changes when using 'system' theme
  useEffect(() => {
    if (theme !== 'system') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent): void => {
      setIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  const value = useMemo<IThemeContext>(
    () => ({ theme, isDark, setTheme, availableThemes }),
    [theme, isDark, setTheme, availableThemes]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Access the current theme and theme-switching controls.
 *
 * Must be called within a {@link ThemeProvider}.
 * @public
 */
export function useTheme(): IThemeContext {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
