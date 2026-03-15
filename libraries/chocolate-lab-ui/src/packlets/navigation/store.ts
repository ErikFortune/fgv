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
  DEFAULT_COLLECTION_VISIBILITY,
  DEFAULT_FILTER_STATE,
  DEFAULT_TABS,
  ICascadeEntry,
  ICollectionVisibility,
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
  /** Whether the entity list is collapsed (user has focused into the detail pane) */
  readonly listCollapsed: boolean;
  /** Per-tab filter state (persisted across tab switches) */
  readonly filtersByTab: Partial<Record<AppTab, IFilterState>>;
  /** Per-tab collection visibility (persisted across tab switches) */
  readonly collectionVisibilityByTab: Partial<Record<AppTab, ICollectionVisibility>>;
  /** Whether compare mode is active (multi-select for side-by-side comparison) */
  readonly compareMode: boolean;
  /** Entity IDs selected for comparison */
  readonly compareIds: ReadonlySet<string>;
  /** Whether the comparison view is actively showing (user clicked 'Compare Now') */
  readonly showingComparison: boolean;
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
  /** Replace the cascade stack atomically (squash to new entries). */
  squashCascade: (entries: ReadonlyArray<ICascadeEntry>) => void;
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
  /** Collapse the entity list (user focused into detail pane). */
  collapseList: () => void;
  /** Clear all filters across all tabs. */
  clearAllFilters: () => void;
  /** Toggle visibility of a collection on a specific tab. */
  toggleCollectionVisibility: (tab: AppTab, collectionId: string) => void;
  /** Set visibility for all collections on a specific tab. */
  setAllCollectionsVisible: (tab: AppTab, visible: boolean, collectionIds: ReadonlyArray<string>) => void;
  /** Toggle compare mode on/off. Turning off clears compare selections. */
  toggleCompareMode: () => void;
  /** Toggle an entity ID in/out of the compare selection (max 4). */
  toggleCompareId: (id: string) => void;
  /** Clear all compare selections (without leaving compare mode). */
  clearCompareIds: () => void;
  /** Show the comparison view (user explicitly triggered compare). */
  startComparison: () => void;
  /** Exit the comparison view back to the selection list. */
  exitComparison: () => void;
  /** Update the hasChanges flag on a cascade entry by entity ID. */
  updateCascadeEntryChanges: (entityId: string, hasChanges: boolean) => void;
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
    listCollapsed: false,
    filtersByTab: {},
    collectionVisibilityByTab: {},
    compareMode: false,
    compareIds: new Set<string>(),
    showingComparison: false,

    // ---- Actions ----
    setMode: (mode: AppMode): void => {
      set({
        mode,
        cascadeStack: [],
        listCollapsed: false,
        compareMode: false,
        compareIds: new Set<string>(),
        showingComparison: false
      });
    },

    setTab: (tab: AppTab): void => {
      set((state) => {
        const mode = state.mode;
        const validTabs = MODE_TABS[mode];
        if (tab !== 'settings' && !validTabs.includes(tab)) {
          console.error(`[NavigationStore] setTab: tab "${tab}" is not valid for mode "${mode}"`);
          return state;
        }
        return {
          activeTabByMode: { ...state.activeTabByMode, [mode]: tab },
          cascadeStack: [],
          listCollapsed: false,
          compareMode: false,
          compareIds: new Set<string>(),
          showingComparison: false
        };
      });
    },

    pushCascade: (entry: ICascadeEntry): void => {
      set((state) => ({
        cascadeStack: [...state.cascadeStack, entry]
      }));
    },

    squashCascade: (entries: ReadonlyArray<ICascadeEntry>): void => {
      set((state) => ({
        cascadeStack: entries,
        listCollapsed: entries.length === 0 ? false : state.listCollapsed
      }));
    },

    popCascade: (): void => {
      set((state) => ({
        cascadeStack: state.cascadeStack.slice(0, -1)
      }));
    },

    popCascadeTo: (depth: number): void => {
      set((state) => {
        const newStack = state.cascadeStack.slice(0, Math.max(0, depth));
        return {
          cascadeStack: newStack,
          listCollapsed: newStack.length > 0 ? state.listCollapsed : false
        };
      });
    },

    clearCascade: (): void => {
      set({ cascadeStack: [], listCollapsed: false });
    },

    collapseList: (): void => {
      set({ listCollapsed: true });
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
    },

    toggleCollectionVisibility: (tab: AppTab, collectionId: string): void => {
      set((state) => {
        const existing = state.collectionVisibilityByTab[tab] ?? {};
        const currentlyVisible = existing[collectionId] !== false;
        return {
          collectionVisibilityByTab: {
            ...state.collectionVisibilityByTab,
            [tab]: { ...existing, [collectionId]: !currentlyVisible }
          }
        };
      });
    },

    setAllCollectionsVisible: (tab: AppTab, visible: boolean, collectionIds: ReadonlyArray<string>): void => {
      set((state) => {
        const updated: Record<string, boolean> = {};
        for (const id of collectionIds) {
          updated[id] = visible;
        }
        return {
          collectionVisibilityByTab: {
            ...state.collectionVisibilityByTab,
            [tab]: updated
          }
        };
      });
    },

    toggleCompareMode: (): void => {
      set((state) => ({
        compareMode: !state.compareMode,
        compareIds: new Set<string>(),
        showingComparison: false,
        cascadeStack: [],
        listCollapsed: false
      }));
    },

    toggleCompareId: (id: string): void => {
      set((state) => {
        const next = new Set(state.compareIds);
        if (next.has(id)) {
          next.delete(id);
        } else if (next.size < 4) {
          next.add(id);
        }
        return { compareIds: next };
      });
    },

    clearCompareIds: (): void => {
      set({ compareIds: new Set<string>(), showingComparison: false });
    },

    startComparison: (): void => {
      set((state) => {
        if (state.compareIds.size < 2) {
          return state;
        }
        return { showingComparison: true };
      });
    },

    exitComparison: (): void => {
      set({ showingComparison: false });
    },

    updateCascadeEntryChanges: (entityId: string, hasChanges: boolean): void => {
      set((state) => ({
        cascadeStack: state.cascadeStack.map((entry) =>
          entry.entityId === entityId ? { ...entry, hasChanges } : entry
        )
      }));
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

/**
 * Selector: get the collection visibility state for the current tab.
 * @public
 */
export function selectCurrentCollectionVisibility(state: INavigationState): ICollectionVisibility {
  const tab = selectActiveTab(state);
  return state.collectionVisibilityByTab[tab] ?? DEFAULT_COLLECTION_VISIBILITY;
}

/**
 * Returns whether a specific collection is visible on the current tab.
 * Collections not in the visibility map are visible by default.
 * @public
 */
export function isCollectionVisible(visibility: ICollectionVisibility, collectionId: string): boolean {
  return visibility[collectionId] !== false;
}
