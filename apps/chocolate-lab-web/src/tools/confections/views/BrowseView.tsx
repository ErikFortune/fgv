/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useMemo } from 'react';
import { useRuntime } from '../../../contexts/RuntimeContext';
import { LoadingSpinner } from '../../../components/common';
import { ConfectionCard } from '@fgv/ts-chocolate-ui';
import type { ConfectionId } from '@fgv/ts-chocolate';
import type { IConfectionFilters } from '../types';

/**
 * Props for the BrowseView component
 */
export interface IBrowseViewProps {
  /** Current filters */
  filters: IConfectionFilters;
  /** Selected confection ID */
  selectedId: ConfectionId | null;
  /** Selection handler */
  onSelect: (id: ConfectionId) => void;
}

/**
 * Browse view for confections
 */
export function BrowseView({ filters, selectedId, onSelect }: IBrowseViewProps): React.ReactElement {
  const { runtime, loadingState, confectionCount, dataVersion } = useRuntime();

  // Filter and sort confections - dataVersion triggers recalculation when library data changes
  const filteredConfections = useMemo(() => {
    if (!runtime) return [];

    const confections = Array.from(runtime.runtimeConfections.entries());

    return confections
      .filter(([id, confection]) => {
        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const nameMatch = confection.name.toLowerCase().includes(searchLower);
          const descMatch = confection.description?.toLowerCase().includes(searchLower) ?? false;
          if (!nameMatch && !descMatch) {
            return false;
          }
        }

        // Confection type filter
        if (filters.confectionTypes.length > 0) {
          if (!filters.confectionTypes.includes(confection.confectionType)) {
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
          const confectionTags = confection.effectiveTags ?? [];
          const hasMatchingTag = filters.tags.some((tag) => confectionTags.includes(tag));
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
        <LoadingSpinner size="lg" message="Loading confections..." />
      </div>
    );
  }

  if (loadingState === 'error') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500 dark:text-red-400">Failed to load confections</p>
      </div>
    );
  }

  if (filteredConfections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-2">
          {confectionCount === 0 ? 'No confections loaded' : 'No confections match your filters'}
        </p>
        {confectionCount > 0 && filters.search && (
          <p className="text-sm text-gray-400 dark:text-gray-500">Try adjusting your search or filters</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {filteredConfections.length} of {confectionCount} confections
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filteredConfections.map(([id, confection]) => (
          <ConfectionCard
            key={id}
            confection={confection}
            isSelected={id === selectedId}
            onClick={() => onSelect(id)}
            showCollection={true}
          />
        ))}
      </div>
    </div>
  );
}
