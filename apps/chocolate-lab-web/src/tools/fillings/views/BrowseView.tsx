/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useMemo } from 'react';
import { useRuntime } from '../../../contexts/RuntimeContext';
import { LoadingSpinner } from '../../../components/common';
import { FillingCard } from '@fgv/ts-chocolate-ui';
import type { FillingId, SourceId } from '@fgv/ts-chocolate';
import type { IFillingFilters } from '../FillingsToolSidebar';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useSettings } from '../../../contexts/SettingsContext';
import { AddFillingDialog } from '../../../components/collections/FillingCollectionManagementPanel';

/**
 * Props for the BrowseView component
 */
export interface IBrowseViewProps {
  /** Current filters */
  filters: IFillingFilters;
  /** Selected filling ID */
  selectedId: FillingId | null;
  /** Selection handler */
  onSelect: (id: FillingId) => void;
}

/**
 * Browse view for fillings
 */
export function BrowseView({ filters, selectedId, onSelect }: IBrowseViewProps): React.ReactElement {
  const { runtime, loadingState, fillingCount, dataVersion } = useRuntime();
  const { settings } = useSettings();
  const [showAddFilling, setShowAddFilling] = React.useState(false);

  const defaultCollectionId = useMemo((): SourceId | null => {
    if (!runtime) {
      return null;
    }

    const isMutable = (id: SourceId): boolean => {
      const collectionResult = runtime.library.fillings.collections.get(id);
      return collectionResult.isSuccess() && !!collectionResult.value && collectionResult.value.isMutable;
    };

    const isUnlocked = (id: SourceId): boolean => {
      const meta = settings.collections[id];
      return meta?.unlocked !== false;
    };

    const preferred = settings.defaultCollections?.fillings;
    if (preferred) {
      const preferredId = preferred as SourceId;
      if (isMutable(preferredId) && isUnlocked(preferredId)) {
        return preferredId;
      }
    }

    if (filters.collections.length === 1) {
      const filteredId = filters.collections[0] as SourceId;
      if (isMutable(filteredId) && isUnlocked(filteredId)) {
        return filteredId;
      }
    }

    const ids = Array.from(runtime.library.fillings.collections.keys()) as SourceId[];
    const firstMutable = ids.find((id) => isMutable(id) && isUnlocked(id));
    return firstMutable ?? null;
  }, [filters.collections, runtime, settings.collections, settings.defaultCollections]);

  // Filter and sort fillings - dataVersion triggers recalculation when library data changes
  const filteredFillings = useMemo(() => {
    if (!runtime) return [];

    const fillings = Array.from(runtime.fillings.entries());

    return fillings
      .filter(([id, filling]) => {
        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const nameMatch = filling.name.toLowerCase().includes(searchLower);
          const descMatch = filling.description?.toLowerCase().includes(searchLower) ?? false;
          if (!nameMatch && !descMatch) {
            return false;
          }
        }

        // Category filter
        if (filters.categories.length > 0) {
          if (!filters.categories.includes(filling.raw.category)) {
            return false;
          }
        }

        // Collection filter
        if (filters.collections.length > 0) {
          const sourceId = id.split('.')[0];
          if (!filters.collections.includes(sourceId)) {
            return false;
          }
        }

        // Tags filter
        if (filters.tags.length > 0) {
          const fillingTags = filling.tags ?? [];
          const hasMatchingTag = filters.tags.some((tag) => fillingTags.includes(tag));
          if (!hasMatchingTag) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => a[1].name.localeCompare(b[1].name));
  }, [runtime, filters, dataVersion]);

  if (loadingState === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" message="Loading fillings..." />
      </div>
    );
  }

  if (loadingState === 'error') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500 dark:text-red-400">Failed to load fillings</p>
      </div>
    );
  }

  if (filteredFillings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-2">
          {fillingCount === 0 ? 'No fillings loaded' : 'No fillings match your filters'}
        </p>
        {fillingCount > 0 && filters.search && (
          <p className="text-sm text-gray-400 dark:text-gray-500">Try adjusting your search or filters</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {filteredFillings.length} of {fillingCount} fillings
        </p>

        <button
          type="button"
          onClick={() => setShowAddFilling(true)}
          disabled={!defaultCollectionId}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-chocolate-600 hover:bg-chocolate-700 rounded-md disabled:opacity-50"
        >
          <PlusIcon className="w-4 h-4" />
          Add Filling
        </button>
      </div>

      {showAddFilling && defaultCollectionId && (
        <AddFillingDialog collectionId={defaultCollectionId} onClose={() => setShowAddFilling(false)} />
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filteredFillings.map(([id, filling]) => (
          <FillingCard
            key={id}
            filling={filling}
            isSelected={id === selectedId}
            onClick={() => onSelect(id)}
            showCollection={true}
          />
        ))}
      </div>
    </div>
  );
}
