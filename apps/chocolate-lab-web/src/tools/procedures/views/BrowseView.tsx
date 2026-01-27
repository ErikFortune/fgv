import * as React from 'react';
import { useMemo } from 'react';
import type { ProcedureId, SourceId } from '@fgv/ts-chocolate';
import { useRuntime } from '../../../contexts/RuntimeContext';
import { LoadingSpinner } from '../../../components/common';
import type { IProcedureFilters } from '../ProceduresToolSidebar';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useSettings } from '../../../contexts/SettingsContext';
import { AddProcedureDialog } from '../../../components/collections/ProcedureCollectionManagementPanel';

export interface IBrowseViewProps {
  filters: IProcedureFilters;
  selectedId: ProcedureId | null;
  onSelect: (id: ProcedureId) => void;
}

function getSourceId(id: ProcedureId): string {
  return (id as string).split('.')[0] ?? '';
}

function ProcedureRow({
  id,
  procedure,
  isSelected,
  onClick
}: {
  id: ProcedureId;
  procedure: {
    name: string;
    description?: string;
    tags?: ReadonlyArray<string>;
    steps: ReadonlyArray<unknown>;
  };
  isSelected: boolean;
  onClick: () => void;
}): React.ReactElement {
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
            {procedure.name}
          </h3>
          {procedure.description ? (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
              {procedure.description}
            </p>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">No description</p>
          )}
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{id as string}</div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">{procedure.steps.length} steps</span>
        {procedure.tags && procedure.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1 justify-end">
            {procedure.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="inline-block text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded px-1.5 py-0.5"
              >
                {tag}
              </span>
            ))}
            {procedure.tags.length > 4 ? (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                +{procedure.tags.length - 4} more
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </button>
  );
}

export function BrowseView({ filters, selectedId, onSelect }: IBrowseViewProps): React.ReactElement {
  const { runtime, loadingState, dataVersion } = useRuntime();
  const { settings } = useSettings();
  const [showAddProcedure, setShowAddProcedure] = React.useState(false);

  const defaultCollectionId = useMemo((): SourceId | null => {
    if (!runtime) {
      return null;
    }

    const isMutable = (id: SourceId): boolean => {
      const collectionResult = runtime.library.procedures.collections.get(id);
      return collectionResult.isSuccess() && !!collectionResult.value && collectionResult.value.isMutable;
    };

    const isUnlocked = (id: SourceId): boolean => {
      const meta = settings.collections[id];
      return meta?.unlocked !== false;
    };

    const preferred = settings.defaultCollections?.procedures;
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

    const ids = Array.from(runtime.library.procedures.collections.keys()) as SourceId[];
    const firstMutable = ids.find((id) => isMutable(id) && isUnlocked(id));
    return firstMutable ?? null;
  }, [filters.collections, runtime, settings.collections, settings.defaultCollections]);

  const filteredProcedures = useMemo(() => {
    void dataVersion;
    if (!runtime) return [];

    const procedures = Array.from(runtime.library.procedures.entries());

    return procedures
      .filter(([id, procedure]) => {
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const nameMatch = procedure.name.toLowerCase().includes(searchLower);
          const descMatch = (procedure.description ?? '').toLowerCase().includes(searchLower);
          if (!nameMatch && !descMatch) {
            return false;
          }
        }

        if (filters.collections.length > 0) {
          const sourceId = getSourceId(id);
          if (!filters.collections.includes(sourceId)) {
            return false;
          }
        }

        if (filters.tags.length > 0) {
          const procedureTags = procedure.tags ?? [];
          const hasMatchingTag = filters.tags.some((tag) => procedureTags.includes(tag));
          if (!hasMatchingTag) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => a[1].name.localeCompare(b[1].name));
  }, [dataVersion, filters, runtime]);

  if (loadingState === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" message="Loading procedures..." />
      </div>
    );
  }

  if (loadingState === 'error') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500 dark:text-red-400">Failed to load procedures</p>
      </div>
    );
  }

  if (!runtime) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-gray-500 dark:text-gray-400">No procedures loaded</p>
      </div>
    );
  }

  const totalCount = runtime.library.procedures.size;

  if (filteredProcedures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-2">
          {totalCount === 0 ? 'No procedures loaded' : 'No procedures match your filters'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {filteredProcedures.length} of {totalCount} procedures
        </p>

        <button
          type="button"
          onClick={() => setShowAddProcedure(true)}
          disabled={!defaultCollectionId}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-chocolate-600 hover:bg-chocolate-700 rounded-md disabled:opacity-50"
        >
          <PlusIcon className="w-4 h-4" />
          Add Procedure
        </button>
      </div>

      {showAddProcedure && defaultCollectionId && (
        <AddProcedureDialog collectionId={defaultCollectionId} onClose={() => setShowAddProcedure(false)} />
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProcedures.map(([id, procedure]) => (
          <ProcedureRow
            key={id as string}
            id={id}
            procedure={procedure}
            isSelected={id === selectedId}
            onClick={() => onSelect(id)}
          />
        ))}
      </div>
    </div>
  );
}
