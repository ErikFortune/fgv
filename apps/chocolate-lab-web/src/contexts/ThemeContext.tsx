/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import React, { createContext, useContext, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

/**
 * Theme mode options
 * - 'light': Always use light theme
 * - 'dark': Always use dark theme
 * - 'system': Follow system preference
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Resolved theme (actual applied theme)
 */
export type ResolvedTheme = 'light' | 'dark';

/**
 * Theme context value
 */
export interface IThemeContext {
  /** Current theme mode setting */
  mode: ThemeMode;
  /** Resolved theme (actual applied theme) */
  resolvedTheme: ResolvedTheme;
  /** Set the theme mode */
  setMode: (mode: ThemeMode) => void;
  /** Toggle between light and dark (sets explicit mode, not system) */
  toggle: () => void;
}

const STORAGE_KEY = 'chocolate-lab-theme';

/**
 * Get the system preferred color scheme
 */
function getSystemTheme(): ResolvedTheme {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

/**
 * Resolve the theme mode to an actual theme
 */
function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') {
    return getSystemTheme();
  }
  return mode;
}

/**
 * Default theme context (for use outside provider)
 */
const defaultThemeContext: IThemeContext = {
  mode: 'system',
  resolvedTheme: 'light',
  setMode: () => {},
  toggle: () => {}
};

/**
 * React context for theme management
 */
export const ThemeContext = createContext<IThemeContext>(defaultThemeContext);

/**
 * Props for the ThemeProvider component
 */
export interface IThemeProviderProps {
  /** Child components */
  children: ReactNode;
  /** Default theme mode (defaults to 'system') */
  defaultMode?: ThemeMode;
}

/**
 * Provider component that manages theme state and applies it to the document
 */
export function ThemeProvider({ children, defaultMode = 'system' }: IThemeProviderProps): React.ReactElement {
  const [mode, setMode] = useLocalStorage<ThemeMode>(STORAGE_KEY, defaultMode);
  const [systemTheme, setSystemTheme] = React.useState<ResolvedTheme>(getSystemTheme);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent): void => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Calculate resolved theme
  const resolvedTheme = useMemo((): ResolvedTheme => {
    if (mode === 'system') {
      return systemTheme;
    }
    return mode;
  }, [mode, systemTheme]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [resolvedTheme]);

  // Toggle between light and dark
  const toggle = useCallback(() => {
    setMode(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setMode]);

  const value = useMemo(
    (): IThemeContext => ({
      mode,
      resolvedTheme,
      setMode,
      toggle
    }),
    [mode, resolvedTheme, setMode, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Hook to access theme context
 *
 * @example
 * ```tsx
 * function ThemeToggle() {
 *   const { resolvedTheme, toggle, mode, setMode } = useTheme();
 *
 *   return (
 *     <div>
 *       <button onClick={toggle}>
 *         {resolvedTheme === 'dark' ? '☀️' : '🌙'}
 *       </button>
 *       <select value={mode} onChange={(e) => setMode(e.target.value as ThemeMode)}>
 *         <option value="light">Light</option>
 *         <option value="dark">Dark</option>
 *         <option value="system">System</option>
 *       </select>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTheme(): IThemeContext {
  return useContext(ThemeContext);
}
