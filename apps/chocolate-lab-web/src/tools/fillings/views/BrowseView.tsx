/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useMemo } from 'react';
import { useChocolate } from '../../../contexts/ChocolateContext';
import { LoadingSpinner } from '../../../components/common';
import { FillingCard } from '@fgv/ts-chocolate-ui';
import type { FillingId } from '@fgv/ts-chocolate';
import type { IFillingFilters } from '../FillingsToolSidebar';

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
  const { runtime, loadingState, fillingCount, dataVersion } = useChocolate();

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
      </div>

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
