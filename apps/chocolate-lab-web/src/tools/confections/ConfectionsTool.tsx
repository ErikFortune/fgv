/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import type { ConfectionId } from '@fgv/ts-chocolate';
import { BrowseView } from './views/BrowseView';
import { DetailView } from './views/DetailView';
import { ProductionView } from './views/ProductionView';
import type { IConfectionFilters } from './types';

/**
 * Props for the ConfectionsTool component
 */
export interface IConfectionsToolProps {
  /** Current filters (passed from App) */
  filters: IConfectionFilters;
}

/**
 * Confections tool with browse and detail views
 */
export function ConfectionsTool({ filters }: IConfectionsToolProps): React.ReactElement {
  const [selectedId, setSelectedId] = useState<ConfectionId | null>(null);
  const [viewMode, setViewMode] = useState<'browse' | 'detail'>('browse');
  const [toolMode, setToolMode] = useState<'browse' | 'production'>('browse');

  useEffect(() => {
    const applyHashSelection = (): void => {
      const hash = window.location.hash;
      if (!hash.startsWith('#confections/')) {
        return;
      }
      const rawId = hash.slice('#confections/'.length);
      if (rawId.length === 0) {
        return;
      }
      setSelectedId(rawId as ConfectionId);
      setViewMode('detail');
    };

    applyHashSelection();
    window.addEventListener('hashchange', applyHashSelection);
    return () => window.removeEventListener('hashchange', applyHashSelection);
  }, [filters]);

  const handleSelect = (id: ConfectionId): void => {
    setSelectedId(id);
    setViewMode('detail');
  };

  const handleBack = (): void => {
    setViewMode('browse');
  };

  if (toolMode === 'production') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="inline-flex rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              type="button"
              onClick={() => setToolMode('browse')}
              className="px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Browse
            </button>
            <button
              type="button"
              onClick={() => setToolMode('production')}
              className="px-3 py-1.5 text-sm bg-chocolate-600 text-white"
            >
              Production
            </button>
          </div>
        </div>

        <ProductionView selectedConfectionId={selectedId} />
      </div>
    );
  }

  if (viewMode === 'detail' && selectedId) {
    return <DetailView confectionId={selectedId} onBack={handleBack} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            type="button"
            onClick={() => setToolMode('browse')}
            className="px-3 py-1.5 text-sm bg-chocolate-600 text-white"
          >
            Browse
          </button>
          <button
            type="button"
            onClick={() => setToolMode('production')}
            className="px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Production
          </button>
        </div>
      </div>

      <BrowseView filters={filters} selectedId={selectedId} onSelect={handleSelect} />
    </div>
  );
}
