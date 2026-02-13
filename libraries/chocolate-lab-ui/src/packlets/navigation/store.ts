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
 * Zustand navigation store for Chocolate Lab.
 *
 * Manages global UI navigation state:
 * - Current mode (Production / Library)
 * - Active tab per mode
 * - Column cascade stack
 * - Per-tab filter state
 *
 * @packageDocumentation
 */

import { create, type StoreApi, type UseBoundStore } from 'zustand';

import {
  AppMode,
  AppTab,
  DEFAULT_FILTER_STATE,
  DEFAULT_TABS,
  ICascadeEntry,
  IFilterState,
  MODE_TABS,
  createDefaultFilterState,
  hasActiveFilters
} from './model';

// ============================================================================
// Store State
// ============================================================================

/**
 * Navigation store state shape.
 * @public
 */
export interface INavigationState {
  /** Current top-level mode */
  readonly mode: AppMode;
  /** Active tab per mode (persisted across mode switches) */
  readonly activeTabByMode: Record<AppMode, AppTab>;
  /** Column cascade stack (ordered left-to-right) */
  readonly cascadeStack: ReadonlyArray<ICascadeEntry>;
  /** Per-tab filter state (persisted across tab switches) */
  readonly filtersByTab: Partial<Record<AppTab, IFilterState>>;
}

// ============================================================================
// Store Actions
// ============================================================================

/**
 * Navigation store actions.
 * @public
 */
export interface INavigationActions {
  /** Switch to a different mode. Clears the cascade stack. */
  setMode: (mode: AppMode) => void;
  /** Switch to a different tab within the current mode. Clears the cascade stack. */
  setTab: (tab: AppTab) => void;
  /** Push an entity onto the cascade stack. */
  pushCascade: (entry: ICascadeEntry) => void;
  /** Pop the rightmost cascade column. */
  popCascade: () => void;
  /** Pop the cascade stack back to a specific depth (0 = clear all). */
  popCascadeTo: (depth: number) => void;
  /** Clear the entire cascade stack. */
  clearCascade: () => void;
  /** Update the filter state for a specific tab. */
  setFilter: (tab: AppTab, filter: Partial<IFilterState>) => void;
  /** Clear the filter state for a specific tab. */
  clearFilter: (tab: AppTab) => void;
  /** Clear all filters across all tabs. */
  clearAllFilters: () => void;
}

// ============================================================================
// Combined Store Type
// ============================================================================

/**
 * Full navigation store type (state + actions).
 * @public
 */
export type NavigationStore = INavigationState & INavigationActions;

// ============================================================================
// Store Creation
// ============================================================================

/**
 * Creates the navigation Zustand store.
 * @public
 */
export const useNavigationStore: UseBoundStore<StoreApi<NavigationStore>> = create<NavigationStore>()(
  (set) => ({
    // ---- Initial State ----
    mode: 'library',
    activeTabByMode: {
      production: DEFAULT_TABS.production,
      library: DEFAULT_TABS.library
    },
    cascadeStack: [],
    filtersByTab: {},

    // ---- Actions ----
    setMode: (mode: AppMode): void => {
      set({ mode, cascadeStack: [] });
    },

    setTab: (tab: AppTab): void => {
      set((state) => {
        const mode = state.mode;
        const validTabs = MODE_TABS[mode];
        if (!validTabs.includes(tab)) {
          return state;
        }
        return {
          activeTabByMode: { ...state.activeTabByMode, [mode]: tab },
          cascadeStack: []
        };
      });
    },

    pushCascade: (entry: ICascadeEntry): void => {
      set((state) => ({
        cascadeStack: [...state.cascadeStack, entry]
      }));
    },

    popCascade: (): void => {
      set((state) => ({
        cascadeStack: state.cascadeStack.slice(0, -1)
      }));
    },

    popCascadeTo: (depth: number): void => {
      set((state) => ({
        cascadeStack: state.cascadeStack.slice(0, Math.max(0, depth))
      }));
    },

    clearCascade: (): void => {
      set({ cascadeStack: [] });
    },

    setFilter: (tab: AppTab, filter: Partial<IFilterState>): void => {
      set((state) => {
        const existing = state.filtersByTab[tab] ?? createDefaultFilterState();
        return {
          filtersByTab: {
            ...state.filtersByTab,
            [tab]: { ...existing, ...filter }
          }
        };
      });
    },

    clearFilter: (tab: AppTab): void => {
      set((state) => {
        const updated = { ...state.filtersByTab };
        delete updated[tab];
        return { filtersByTab: updated };
      });
    },

    clearAllFilters: (): void => {
      set({ filtersByTab: {} });
    }
  })
);

// ============================================================================
// Derived Selectors
// ============================================================================

/**
 * Selector: get the active tab for the current mode.
 * @public
 */
export function selectActiveTab(state: INavigationState): AppTab {
  return state.activeTabByMode[state.mode];
}

/**
 * Selector: get the filter state for the current tab.
 * @public
 */
export function selectCurrentFilter(state: INavigationState): IFilterState {
  const tab = selectActiveTab(state);
  return state.filtersByTab[tab] ?? DEFAULT_FILTER_STATE;
}

/**
 * Selector: get the tabs available for the current mode.
 * @public
 */
export function selectModeTabs(state: INavigationState): ReadonlyArray<AppTab> {
  return MODE_TABS[state.mode];
}

/**
 * Selector: whether any filters are active across all tabs.
 * @public
 */
export function selectHasActiveFilters(state: INavigationState): boolean {
  return Object.values(state.filtersByTab).some((f) => f !== undefined && hasActiveFilters(f));
}
