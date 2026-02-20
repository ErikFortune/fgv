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
 * Chocolate-specific sidebar content per tab.
 *
 * Wires the generic FilterBar/FilterRow from ts-app-shell with
 * the navigation store's filter state and the per-tab filter definitions.
 *
 * @packageDocumentation
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  CollectionSection,
  ConfirmDialog,
  FilterBar,
  FilterRow,
  type IFilterOption
} from '@fgv/ts-app-shell';

import {
  type AppTab,
  type IFilterState,
  countActiveSelections,
  useNavigationStore,
  selectActiveTab,
  selectCurrentFilter
} from '../navigation';

import { useCollectionInfo } from './collectionInfo';
import { CreateCollectionDialog, type ICreateCollectionData } from './CreateCollectionDialog';

import { TAB_FILTER_DEFINITIONS, type IFilterDefinition } from './filterConfigs';

// ============================================================================
// Filter Option Provider
// ============================================================================

/**
 * Provides filter options for a given tab and filter key.
 *
 * In Phase 2, this returns static placeholder options.
 * In Phase 3+, this will be wired to the workspace data to provide
 * dynamic options with counts.
 *
 * @public
 */
export interface IFilterOptionProvider {
  readonly getOptions: (tab: AppTab, filterKey: string) => ReadonlyArray<IFilterOption<string>>;
}

/**
 * Default filter option provider that returns placeholder options.
 * @internal
 */
const PLACEHOLDER_PROVIDER: IFilterOptionProvider = {
  getOptions: (): ReadonlyArray<IFilterOption<string>> => {
    return [];
  }
};

// ============================================================================
// TabSidebar Props
// ============================================================================

/**
 * Props for the TabSidebar component.
 * @public
 */
export interface ITabSidebarProps {
  /** Optional filter option provider (defaults to placeholder) */
  readonly optionProvider?: IFilterOptionProvider;
  /** Callback when "Add Directory" is clicked in the collection section */
  readonly onAddDirectory?: () => void;
  /** Callback when the user confirms creation of a new collection */
  readonly onCreateCollection?: (data: ICreateCollectionData) => void;
  /** Callback when delete is clicked for a mutable collection */
  readonly onDeleteCollection?: (collectionId: string) => void;
}

// ============================================================================
// TabSidebar Component
// ============================================================================

/**
 * Chocolate-specific sidebar content that renders the appropriate
 * filter bar for the currently active tab.
 *
 * Reads the active tab and filter state from the navigation store,
 * renders FilterBar + FilterRow components from ts-app-shell,
 * and writes filter changes back to the store.
 *
 * @public
 */
export function TabSidebar(props: ITabSidebarProps): React.ReactElement {
  const {
    optionProvider = PLACEHOLDER_PROVIDER,
    onAddDirectory,
    onCreateCollection,
    onDeleteCollection
  } = props;

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(null);

  const activeTab = useNavigationStore(selectActiveTab);
  const filterState = useNavigationStore(selectCurrentFilter);
  const setFilter = useNavigationStore((s) => s.setFilter);
  const clearFilter = useNavigationStore((s) => s.clearFilter);
  const toggleCollectionVisibility = useNavigationStore((s) => s.toggleCollectionVisibility);

  const collectionInfos = useCollectionInfo();

  const filterDefs = TAB_FILTER_DEFINITIONS[activeTab];

  const handleSearchChange = useCallback(
    (search: string): void => {
      setFilter(activeTab, { search });
    },
    [activeTab, setFilter]
  );

  const handleSelectionChange = useCallback(
    (filterKey: string, selected: ReadonlyArray<string>): void => {
      setFilter(activeTab, {
        selections: { ...filterState.selections, [filterKey]: selected }
      });
    },
    [activeTab, filterState.selections, setFilter]
  );

  const handleClearAll = useCallback((): void => {
    clearFilter(activeTab);
  }, [activeTab, clearFilter]);

  const handleToggleCollectionVisibility = useCallback(
    (collectionId: string): void => {
      toggleCollectionVisibility(activeTab, collectionId);
    },
    [activeTab, toggleCollectionVisibility]
  );

  const handleRequestDeleteCollection = useCallback((collectionId: string): void => {
    setCollectionToDelete(collectionId);
  }, []);

  const handleConfirmDeleteCollection = useCallback((): void => {
    if (collectionToDelete) {
      onDeleteCollection?.(collectionToDelete);
    }
    setCollectionToDelete(null);
  }, [collectionToDelete, onDeleteCollection]);

  const handleCancelDeleteCollection = useCallback((): void => {
    setCollectionToDelete(null);
  }, []);

  const handleOpenCreateDialog = useCallback((): void => {
    setIsCreateDialogOpen(true);
  }, []);

  const handleCloseCreateDialog = useCallback((): void => {
    setIsCreateDialogOpen(false);
  }, []);

  const handleCreateCollection = useCallback(
    (data: ICreateCollectionData): void => {
      onCreateCollection?.(data);
    },
    [onCreateCollection]
  );

  const existingCollectionIds = useMemo(() => new Set(collectionInfos.map((c) => c.id)), [collectionInfos]);

  const activeFilterCount = useMemo(() => countActiveSelections(filterState), [filterState]);

  return (
    <div className="flex flex-col">
      <FilterBar
        search={{
          value: filterState.search,
          onChange: handleSearchChange,
          placeholder: `Search ${activeTab}...`
        }}
        activeFilterCount={activeFilterCount}
        onClearAll={handleClearAll}
      >
        {filterDefs.map((def: IFilterDefinition) => (
          <FilterRow<string>
            key={def.key}
            label={def.label}
            options={optionProvider.getOptions(activeTab, def.key)}
            selected={getSelections(filterState, def.key)}
            onSelectionChange={(selected): void => handleSelectionChange(def.key, selected)}
            multiple={def.multiple}
          />
        ))}
      </FilterBar>

      <CollectionSection
        collections={collectionInfos}
        onToggleVisibility={handleToggleCollectionVisibility}
        onAddDirectory={onAddDirectory}
        onCreateCollection={onCreateCollection ? handleOpenCreateDialog : undefined}
        onDeleteCollection={onDeleteCollection ? handleRequestDeleteCollection : undefined}
      />

      {onCreateCollection && (
        <CreateCollectionDialog
          isOpen={isCreateDialogOpen}
          onClose={handleCloseCreateDialog}
          onCreate={handleCreateCollection}
          existingIds={existingCollectionIds}
        />
      )}

      <ConfirmDialog
        isOpen={collectionToDelete !== null}
        title="Delete Collection"
        message={
          <>
            Delete <strong>{collectionToDelete}</strong>? This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        severity="danger"
        onConfirm={handleConfirmDeleteCollection}
        onCancel={handleCancelDeleteCollection}
      />
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function getSelections(state: IFilterState, key: string): ReadonlyArray<string> {
  return state.selections[key] ?? [];
}
