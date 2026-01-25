/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import type { ConfectionId } from '@fgv/ts-chocolate';
import { BrowseView } from './views/BrowseView';
import { DetailView } from './views/DetailView';
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
    setSelectedId(null);
  };

  if (viewMode === 'detail' && selectedId) {
    return <DetailView confectionId={selectedId} onBack={handleBack} />;
  }

  return <BrowseView filters={filters} selectedId={selectedId} onSelect={handleSelect} />;
}
