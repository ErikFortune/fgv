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

/**
 * Generic URL hash synchronization for two-tier mode/tab navigation.
 *
 * Encodes mode + tab in the URL hash: `#/{mode}/{tab}`
 * Syncs bidirectionally between application state and the URL.
 * Handles browser back/forward via popstate.
 *
 * @packageDocumentation
 */

import { useEffect, useRef } from 'react';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Configuration for the URL sync hook.
 * Provides the validation tables and default values needed to
 * parse and validate URL hash segments.
 * @public
 */
export interface IUrlSyncConfig<TMode extends string, TTab extends string> {
  /** All valid mode identifiers */
  readonly validModes: ReadonlyArray<TMode>;
  /** Valid tabs per mode */
  readonly validTabs: Record<TMode, ReadonlyArray<TTab>>;
  /** Default tab for each mode (used when hash has a valid mode but no valid tab) */
  readonly defaultTabs: Record<TMode, TTab>;
}

/**
 * Callbacks that connect the URL sync hook to the application's state management.
 * @public
 */
export interface IUrlSyncCallbacks<TMode extends string, TTab extends string> {
  /** Set the active mode */
  readonly setMode: (mode: TMode) => void;
  /** Set the active tab */
  readonly setTab: (tab: TTab) => void;
}

/**
 * Current navigation state to sync to the URL.
 * @public
 */
export interface IUrlSyncState<TMode extends string, TTab extends string> {
  /** Current mode */
  readonly mode: TMode;
  /** Current active tab */
  readonly activeTab: TTab;
}

// ============================================================================
// URL Encoding / Decoding
// ============================================================================

/**
 * Result of parsing a URL hash.
 * @public
 */
export interface IParsedHash<TMode extends string, TTab extends string> {
  readonly mode: TMode;
  readonly tab: TTab;
}

/**
 * Encodes mode + tab into a URL hash string.
 * @param mode - The current mode
 * @param tab - The current tab
 * @returns Hash string (e.g., '#/library/ingredients')
 * @public
 */
export function encodeUrlHash<TMode extends string, TTab extends string>(mode: TMode, tab: TTab): string {
  return `#/${mode}/${tab}`;
}

/**
 * Parses a URL hash string into mode + tab, validated against the config.
 * Returns undefined if the hash is invalid or empty.
 * @param hash - The hash string (with or without leading '#')
 * @param config - Validation configuration
 * @returns Parsed mode and tab, or undefined
 * @public
 */
export function parseUrlHash<TMode extends string, TTab extends string>(
  hash: string,
  config: IUrlSyncConfig<TMode, TTab>
): IParsedHash<TMode, TTab> | undefined {
  const cleaned = hash.replace(/^#\/?/, '');
  if (cleaned.length === 0) {
    return undefined;
  }

  const parts = cleaned.split('/');
  if (parts.length < 1) {
    return undefined;
  }

  const mode = parts[0] as TMode;
  if (!config.validModes.includes(mode)) {
    return undefined;
  }

  const validTabs = config.validTabs[mode];
  if (parts.length >= 2) {
    const tab = parts[1] as TTab;
    if (validTabs.includes(tab)) {
      return { mode, tab };
    }
  }

  // Valid mode but no valid tab — use default
  return { mode, tab: config.defaultTabs[mode] };
}

// ============================================================================
// URL Sync Hook
// ============================================================================

/**
 * Hook that synchronizes two-tier mode/tab navigation state with the URL hash.
 *
 * - On mount: reads the URL hash and applies it to the store
 * - On state change: updates the URL hash (pushes history entry)
 * - On popstate (back/forward): reads the URL hash and applies it to the store
 *
 * Should be called once at the app root level.
 *
 * @param config - Validation configuration (modes, tabs, defaults)
 * @param state - Current navigation state
 * @param callbacks - State mutation callbacks
 * @public
 */
export function useUrlSync<TMode extends string, TTab extends string>(
  config: IUrlSyncConfig<TMode, TTab>,
  state: IUrlSyncState<TMode, TTab>,
  callbacks: IUrlSyncCallbacks<TMode, TTab>
): void {
  const { mode, activeTab } = state;
  const { setMode, setTab } = callbacks;

  // Track whether we're currently applying a URL change to avoid circular updates
  const isApplyingUrl = useRef(false);
  // Track whether we've done the initial load
  const initialized = useRef(false);

  // Keep refs to the latest values so the mount effect captures them without
  // needing them in its dependency array (the effect must only run once).
  const configRef = useRef(config);
  configRef.current = config;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const setModeRef = useRef(setMode);
  setModeRef.current = setMode;
  const setTabRef = useRef(setTab);
  setTabRef.current = setTab;

  // ---- Initial load: URL → store ----
  useEffect(() => {
    if (initialized.current) {
      return;
    }
    initialized.current = true;

    const parsed = parseUrlHash(window.location.hash, configRef.current);
    if (parsed) {
      isApplyingUrl.current = true;
      setModeRef.current(parsed.mode);
      setTabRef.current(parsed.tab);
      isApplyingUrl.current = false;
    } else {
      // No valid hash — write current state to URL
      const hash = encodeUrlHash(modeRef.current, activeTabRef.current);
      window.history.replaceState(null, '', hash);
    }
    // Intentionally empty: this effect must run exactly once on mount.
    // All values are accessed via refs to avoid stale closures.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Store → URL: push history on navigation changes ----
  useEffect(() => {
    if (isApplyingUrl.current) {
      return;
    }

    const hash = encodeUrlHash(mode, activeTab);
    if (window.location.hash !== hash) {
      window.history.pushState(null, '', hash);
    }
  }, [mode, activeTab]);

  // ---- URL → store: handle popstate (back/forward) ----
  useEffect(() => {
    const handlePopState = (): void => {
      const parsed = parseUrlHash(window.location.hash, config);
      if (parsed) {
        isApplyingUrl.current = true;
        setMode(parsed.mode);
        setTab(parsed.tab);
        isApplyingUrl.current = false;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return (): void => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [config, setMode, setTab]);
}
