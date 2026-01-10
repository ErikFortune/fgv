/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import React, { createContext, useContext, useMemo, useCallback, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

/**
 * View mode for lists
 */
export type ViewMode = 'grid' | 'list';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Collection settings
 */
export interface ICollectionSettings {
  /** Whether the collection is enabled (loaded) */
  enabled: boolean;
  /** Whether the collection is currently unlocked (for encrypted collections) */
  unlocked?: boolean;
}

/**
 * Persistent application settings
 */
export interface IAppSettings {
  /** Default view mode for list/grid views */
  defaultViewMode: ViewMode;
  /** Default sort direction */
  defaultSortDirection: SortDirection;
  /** Whether to show collection badges in browse views */
  showCollectionBadges: boolean;
  /** Whether to show the messages pane */
  showMessagesPane: boolean;
  /** Per-collection settings */
  collections: Record<string, ICollectionSettings>;
  /** Sidebar collapsed state per tool */
  sidebarCollapsed: Record<string, boolean>;
}

/**
 * Default settings
 */
const defaultSettings: IAppSettings = {
  defaultViewMode: 'grid',
  defaultSortDirection: 'asc',
  showCollectionBadges: true,
  showMessagesPane: true,
  collections: {},
  sidebarCollapsed: {}
};

/**
 * Settings context value
 */
export interface ISettingsContext {
  /** Current settings */
  settings: IAppSettings;
  /** Update a setting */
  updateSetting: <K extends keyof IAppSettings>(key: K, value: IAppSettings[K]) => void;
  /** Update collection settings */
  updateCollectionSettings: (collectionId: string, settings: Partial<ICollectionSettings>) => void;
  /** Toggle sidebar collapsed state for a tool */
  toggleSidebarCollapsed: (toolId: string) => void;
  /** Reset all settings to defaults */
  resetSettings: () => void;
}

const STORAGE_KEY = 'chocolate-lab-settings';

/**
 * Default context value
 */
const defaultSettingsContext: ISettingsContext = {
  settings: defaultSettings,
  updateSetting: () => {},
  updateCollectionSettings: () => {},
  toggleSidebarCollapsed: () => {},
  resetSettings: () => {}
};

/**
 * React context for settings
 */
export const SettingsContext = createContext<ISettingsContext>(defaultSettingsContext);

/**
 * Props for the SettingsProvider component
 */
export interface ISettingsProviderProps {
  /** Child components */
  children: ReactNode;
}

/**
 * Provider component that manages persistent settings
 */
export function SettingsProvider({ children }: ISettingsProviderProps): React.ReactElement {
  const [settings, setSettings, resetStorage] = useLocalStorage<IAppSettings>(STORAGE_KEY, defaultSettings);

  // Update a single setting
  const updateSetting = useCallback(
    <K extends keyof IAppSettings>(key: K, value: IAppSettings[K]) => {
      setSettings((prev) => ({
        ...prev,
        [key]: value
      }));
    },
    [setSettings]
  );

  // Update collection settings
  const updateCollectionSettings = useCallback(
    (collectionId: string, collectionSettings: Partial<ICollectionSettings>) => {
      setSettings((prev) => ({
        ...prev,
        collections: {
          ...prev.collections,
          [collectionId]: {
            ...prev.collections[collectionId],
            ...collectionSettings
          }
        }
      }));
    },
    [setSettings]
  );

  // Toggle sidebar collapsed state
  const toggleSidebarCollapsed = useCallback(
    (toolId: string) => {
      setSettings((prev) => ({
        ...prev,
        sidebarCollapsed: {
          ...prev.sidebarCollapsed,
          [toolId]: !prev.sidebarCollapsed[toolId]
        }
      }));
    },
    [setSettings]
  );

  // Reset to defaults
  const resetSettings = useCallback(() => {
    resetStorage();
  }, [resetStorage]);

  const value = useMemo(
    (): ISettingsContext => ({
      settings,
      updateSetting,
      updateCollectionSettings,
      toggleSidebarCollapsed,
      resetSettings
    }),
    [settings, updateSetting, updateCollectionSettings, toggleSidebarCollapsed, resetSettings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

/**
 * Hook to access settings context
 *
 * @example
 * ```tsx
 * function ViewToggle() {
 *   const { settings, updateSetting } = useSettings();
 *
 *   return (
 *     <button
 *       onClick={() => updateSetting(
 *         'defaultViewMode',
 *         settings.defaultViewMode === 'grid' ? 'list' : 'grid'
 *       )}
 *     >
 *       {settings.defaultViewMode === 'grid' ? '📋' : '📦'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useSettings(): ISettingsContext {
  return useContext(SettingsContext);
}
