/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import type { ConfectionId } from '@fgv/ts-chocolate';
import { BrowseTools } from '@fgv/ts-chocolate-ui';
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
  const { state, actions } = BrowseTools.useBrowseDetailState<ConfectionId>();
  const { currentId, setId } = BrowseTools.useHashNavigation<ConfectionId>({ prefix: 'confections' });
  const [toolMode, setToolMode] = useState<'browse' | 'production'>('browse');

  // Sync hash navigation to browse/detail state
  useEffect(() => {
    if (currentId) {
      actions.select(currentId);
    }
  }, [currentId, actions]);

  const handleSelect = (id: ConfectionId): void => {
    setId(id);
    actions.select(id);
  };

  const handleBack = (): void => {
    setId(null);
    actions.back();
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

        <ProductionView selectedConfectionId={state.selectedId} />
      </div>
    );
  }

  if (state.viewMode === 'detail' && state.selectedId) {
    return <DetailView confectionId={state.selectedId} onBack={handleBack} />;
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

      <BrowseView filters={filters} selectedId={state.selectedId} onSelect={handleSelect} />
    </div>
  );
}
