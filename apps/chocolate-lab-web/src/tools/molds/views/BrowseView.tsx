/*
 * MIT License
 * Copyright (c) 2026 Erik Fortune
 */

import * as React from 'react';
import { useMemo } from 'react';
import type { MoldId } from '@fgv/ts-chocolate';
import { useChocolate } from '../../../contexts/ChocolateContext';
import { LoadingSpinner } from '../../../components/common';
import type { IMoldFilters } from '../MoldsToolSidebar';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useSettings } from '../../../contexts/SettingsContext';
import type { SourceId } from '@fgv/ts-chocolate';
import { AddMoldDialog } from '../../../components/collections/MoldCollectionManagementPanel';

export interface IBrowseViewProps {
  filters: IMoldFilters;
  selectedId: MoldId | null;
  onSelect: (id: MoldId) => void;
}

function getSourceId(id: MoldId): string {
  return (id as string).split('.')[0] ?? '';
}

function getCavityCount(mold: {
  cavities: { kind: 'grid'; columns: number; rows: number } | { kind: 'count'; count: number };
}): number {
  return mold.cavities.kind === 'grid' ? mold.cavities.columns * mold.cavities.rows : mold.cavities.count;
}

function getCavityWeight(mold: { cavities: { info?: { weight?: number } } }): number | undefined {
  return mold.cavities.info?.weight;
}

function MoldRow({
  id,
  mold,
  isSelected,
  onClick
}: {
  id: MoldId;
  mold: {
    manufacturer: string;
    productNumber: string;
    description?: string;
    format: string;
    tags?: ReadonlyArray<string>;
    cavities:
      | { kind: 'grid'; columns: number; rows: number; info?: { weight?: number } }
      | { kind: 'count'; count: number; info?: { weight?: number } };
  };
  isSelected: boolean;
  onClick: () => void;
}): React.ReactElement {
  const cavityCount = getCavityCount(mold);
  const cavityWeight = getCavityWeight(mold);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-lg border p-4 transition-all duration-150 bg-white dark:bg-gray-800 ${
        isSelected
          ? 'border-chocolate-500 ring-2 ring-chocolate-500 dark:border-chocolate-400 dark:ring-chocolate-400'
          : 'border-gray-200 dark:border-gray-700 hover:border-chocolate-300 hover:shadow-md dark:hover:border-chocolate-600'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 text-base leading-tight truncate">
            {mold.manufacturer} {mold.productNumber}
          </h3>
          {mold.description ? (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">{mold.description}</p>
          ) : null}
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-3">
            <span>{mold.format}</span>
            <span>{cavityCount} cavities</span>
            {cavityWeight !== undefined ? <span>{cavityWeight}g/cavity</span> : null}
          </div>
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{id}</div>
      </div>

      {mold.tags && mold.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1">
          {mold.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="inline-block text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded px-1.5 py-0.5"
            >
              {tag}
            </span>
          ))}
          {mold.tags.length > 4 ? (
            <span className="text-xs text-gray-400 dark:text-gray-500">+{mold.tags.length - 4} more</span>
          ) : null}
        </div>
      ) : null}
    </button>
  );
}

export function BrowseView({ filters, selectedId, onSelect }: IBrowseViewProps): React.ReactElement {
  const { runtime, loadingState, moldCount, dataVersion } = useChocolate();
  const { settings } = useSettings();
  const [showAddMold, setShowAddMold] = React.useState(false);

  const defaultCollectionId = useMemo((): SourceId | null => {
    if (!runtime) {
      return null;
    }

    const isMutable = (id: SourceId): boolean => {
      const collectionResult = runtime.library.molds.collections.get(id);
      return collectionResult.isSuccess() && !!collectionResult.value && collectionResult.value.isMutable;
    };

    const isUnlocked = (id: SourceId): boolean => {
      const meta = settings.collections[id];
      return meta?.unlocked !== false;
    };

    const preferred = settings.defaultCollections?.molds;
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

    const ids = Array.from(runtime.library.molds.collections.keys()) as SourceId[];
    const firstMutable = ids.find((id) => isMutable(id) && isUnlocked(id));
    return firstMutable ?? null;
  }, [filters.collections, runtime, settings.collections, settings.defaultCollections]);

  const filteredMolds = useMemo(() => {
    if (!runtime) return [];

    const molds = Array.from(runtime.library.molds.entries());

    return molds
      .filter(([id, mold]) => {
        void dataVersion;

        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const manufacturerMatch = mold.manufacturer.toLowerCase().includes(searchLower);
          const productMatch = mold.productNumber.toLowerCase().includes(searchLower);
          const descMatch = mold.description?.toLowerCase().includes(searchLower) ?? false;
          const tagMatch = (mold.tags ?? []).some((t) => t.toLowerCase().includes(searchLower));
          if (!manufacturerMatch && !productMatch && !descMatch && !tagMatch) {
            return false;
          }
        }

        if (filters.collections.length > 0) {
          const sourceId = getSourceId(id);
          if (!filters.collections.includes(sourceId)) {
            return false;
          }
        }

        if (filters.formats.length > 0) {
          if (!filters.formats.includes(mold.format)) {
            return false;
          }
        }

        const cavityCount = getCavityCount(mold);
        if (filters.cavityCountMin !== null && cavityCount < filters.cavityCountMin) {
          return false;
        }
        if (filters.cavityCountMax !== null && cavityCount > filters.cavityCountMax) {
          return false;
        }

        const weight = getCavityWeight(mold);
        const hasWeightFilter = filters.cavityWeightMin !== null || filters.cavityWeightMax !== null;
        if (hasWeightFilter && weight === undefined) {
          return false;
        }
        if (filters.cavityWeightMin !== null && weight !== undefined && weight < filters.cavityWeightMin) {
          return false;
        }
        if (filters.cavityWeightMax !== null && weight !== undefined && weight > filters.cavityWeightMax) {
          return false;
        }

        if (filters.tags.length > 0) {
          const moldTags = mold.tags ?? [];
          const hasMatchingTag = filters.tags.some((tag) => moldTags.includes(tag));
          if (!hasMatchingTag) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const ma = `${a[1].manufacturer} ${a[1].productNumber}`;
        const mb = `${b[1].manufacturer} ${b[1].productNumber}`;
        return ma.localeCompare(mb);
      });
  }, [runtime, filters, dataVersion]);

  if (loadingState === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" message="Loading molds..." />
      </div>
    );
  }

  if (loadingState === 'error') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500 dark:text-red-400">Failed to load molds</p>
      </div>
    );
  }

  if (!runtime) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">No runtime loaded</p>
      </div>
    );
  }

  if (filteredMolds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-2">
          {moldCount === 0 ? 'No molds loaded' : 'No molds match your filters'}
        </p>
        {moldCount > 0 && filters.search && (
          <p className="text-sm text-gray-400 dark:text-gray-500">Try adjusting your search or filters</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {filteredMolds.length} of {moldCount} molds
        </p>

        <button
          type="button"
          onClick={() => setShowAddMold(true)}
          disabled={!defaultCollectionId}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-chocolate-600 hover:bg-chocolate-700 rounded-md disabled:opacity-50"
        >
          <PlusIcon className="w-4 h-4" />
          Add Mold
        </button>
      </div>

      {showAddMold && defaultCollectionId && (
        <AddMoldDialog collectionId={defaultCollectionId} onClose={() => setShowAddMold(false)} />
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filteredMolds.map(([id, mold]) => (
          <MoldRow
            key={id as string}
            id={id as MoldId}
            mold={mold as unknown as never}
            isSelected={id === selectedId}
            onClick={() => onSelect(id as MoldId)}
          />
        ))}
      </div>
    </div>
  );
}
