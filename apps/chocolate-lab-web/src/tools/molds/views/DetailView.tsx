/*
 * MIT License
 * Copyright (c) 2026 Erik Fortune
 */

import * as React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import type { MoldId } from '@fgv/ts-chocolate';
import { useRuntime } from '../../../contexts/RuntimeContext';
import { LoadingSpinner } from '../../../components/common';

export interface IDetailViewProps {
  moldId: MoldId;
  onBack: () => void;
}

export function DetailView({ moldId, onBack }: IDetailViewProps): React.ReactElement {
  const { runtime, loadingState } = useRuntime();

  if (loadingState === 'loading' || !runtime) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    );
  }

  const moldResult = runtime.getRuntimeMold(moldId);
  if (moldResult.isFailure()) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-500 dark:text-red-400 mb-4">Mold not found</p>
        <button
          type="button"
          onClick={onBack}
          className="text-chocolate-600 dark:text-chocolate-400 hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const mold = moldResult.value;

  return (
    <div className="max-w-4xl">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to browse
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{mold.displayName}</h1>
            {mold.description ? <p className="text-gray-600 dark:text-gray-400">{mold.description}</p> : null}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{mold.id as string}</div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Format" value={mold.format as unknown as string} />
          <Stat label="Cavities" value={String(mold.cavityCount)} />
          <Stat
            label="g / cavity"
            value={mold.cavityWeight !== undefined ? String(mold.cavityWeight) : '—'}
          />
          <Stat
            label="Total (g)"
            value={mold.totalCapacity !== undefined ? String(mold.totalCapacity) : '—'}
          />
        </div>

        {mold.tags && mold.tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {mold.tags.map((tag) => (
              <span
                key={tag}
                className="inline-block text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded px-2 py-1"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{value}</div>
    </div>
  );
}
