/*
 * MIT License
 * Copyright (c) 2026 Erik Fortune
 */

import * as React from 'react';
import { useMemo } from 'react';
import type { MoldFormat } from '@fgv/ts-chocolate';
import { FilterTools, type IFilterActions, type IBaseFilterState } from '@fgv/ts-chocolate-ui';
import { useChocolate } from '../../contexts/ChocolateContext';
import { MoldCollectionManagementPanel } from '../../components/collections';

export interface IMoldFilters extends IBaseFilterState {
  formats: MoldFormat[];
  cavityCountMin: number | null;
  cavityCountMax: number | null;
  cavityWeightMin: number | null;
  cavityWeightMax: number | null;
}

export interface IMoldsToolSidebarProps {
  filters: IMoldFilters;
  onFiltersChange: (filters: IMoldFilters) => void;
}

function toNumberOrNull(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function MoldsToolSidebar({ filters, onFiltersChange }: IMoldsToolSidebarProps): React.ReactElement {
  const { runtime, dataVersion } = useChocolate();

  const allTags = useMemo((): ReadonlyArray<string> => {
    void dataVersion;
    if (!runtime) return [];

    const tags = new Set<string>();
    for (const [, mold] of runtime.library.molds.entries()) {
      for (const t of mold.tags ?? []) {
        tags.add(t);
      }
    }
    return Array.from(tags.values()).sort((a, b) => a.localeCompare(b));
  }, [dataVersion, runtime]);

  const allFormats = useMemo((): ReadonlyArray<MoldFormat> => {
    void dataVersion;
    if (!runtime) return [];

    const formats = new Set<string>();
    for (const [, mold] of runtime.library.molds.entries()) {
      formats.add(mold.format as string);
    }
    return Array.from(formats.values()).sort((a, b) => a.localeCompare(b)) as MoldFormat[];
  }, [dataVersion, runtime]);

  const toggleFormat = (format: MoldFormat): void => {
    const next = filters.formats.includes(format)
      ? filters.formats.filter((f) => f !== format)
      : [...filters.formats, format];
    onFiltersChange({ ...filters, formats: next });
  };

  // Create filter actions that delegate to onFiltersChange
  const filterActions: IFilterActions<IMoldFilters> = useMemo(
    () => ({
      setSearch: (search: string) => onFiltersChange({ ...filters, search }),
      toggleCollection: (collectionId: string) => {
        const next = filters.collections.includes(collectionId)
          ? filters.collections.filter((c) => c !== collectionId)
          : [...filters.collections, collectionId];
        onFiltersChange({ ...filters, collections: next });
      },
      toggleTag: (tag: string) => {
        const next = filters.tags.includes(tag)
          ? filters.tags.filter((t) => t !== tag)
          : [...filters.tags, tag];
        onFiltersChange({ ...filters, tags: next });
      },
      clearFilters: () =>
        onFiltersChange({
          search: '',
          collections: [],
          tags: [],
          formats: [],
          cavityCountMin: null,
          cavityCountMax: null,
          cavityWeightMin: null,
          cavityWeightMax: null
        }),
      setFilters: (newFilters: IMoldFilters) => onFiltersChange(newFilters),
      hasActiveFilters:
        filters.search.length > 0 ||
        filters.collections.length > 0 ||
        filters.tags.length > 0 ||
        filters.formats.length > 0 ||
        filters.cavityCountMin !== null ||
        filters.cavityCountMax !== null ||
        filters.cavityWeightMin !== null ||
        filters.cavityWeightMax !== null
    }),
    [filters, onFiltersChange]
  );

  // Mold-specific filter controls
  const moldFilterControls = (
    <>
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Cavity count
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={filters.cavityCountMin ?? ''}
            onChange={(e) => onFiltersChange({ ...filters, cavityCountMin: toNumberOrNull(e.target.value) })}
            placeholder="Min"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
          <input
            type="number"
            value={filters.cavityCountMax ?? ''}
            onChange={(e) => onFiltersChange({ ...filters, cavityCountMax: toNumberOrNull(e.target.value) })}
            placeholder="Max"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Per-cavity weight (g)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={filters.cavityWeightMin ?? ''}
            onChange={(e) => onFiltersChange({ ...filters, cavityWeightMin: toNumberOrNull(e.target.value) })}
            placeholder="Min"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
          <input
            type="number"
            value={filters.cavityWeightMax ?? ''}
            onChange={(e) => onFiltersChange({ ...filters, cavityWeightMax: toNumberOrNull(e.target.value) })}
            placeholder="Max"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {allFormats.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Format
          </label>
          <div className="flex flex-wrap gap-2">
            {allFormats.map((format) => (
              <button
                key={format}
                type="button"
                onClick={() => toggleFormat(format)}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  filters.formats.includes(format)
                    ? 'bg-chocolate-600 text-white dark:bg-chocolate-500'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                {format}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );

  return (
    <FilterTools.FilterSidebar
      filters={filters}
      actions={filterActions}
      tags={allTags as string[]}
      searchPlaceholder="Search molds..."
      collectionsPanel={
        <MoldCollectionManagementPanel
          toolId="molds"
          selectedCollectionIds={filters.collections}
          onToggleSelected={filterActions.toggleCollection}
          showHeader={true}
          headerTitle={null}
        />
      }
    >
      {moldFilterControls}
    </FilterTools.FilterSidebar>
  );
}
