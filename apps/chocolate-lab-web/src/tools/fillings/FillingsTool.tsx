/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import type { FillingId } from '@fgv/ts-chocolate';
import { BrowseView } from './views/BrowseView';
import { DetailView } from './views/DetailView';
import type { IFillingFilters } from './FillingsToolSidebar';

/**
 * Props for the FillingsTool component
 */
export interface IFillingsToolProps {
  /** Current filters (passed from App) */
  filters: IFillingFilters;
}

/**
 * Fillings tool with browse and detail views
 */
export function FillingsTool({ filters }: IFillingsToolProps): React.ReactElement {
  const [selectedId, setSelectedId] = useState<FillingId | null>(null);
  const [viewMode, setViewMode] = useState<'browse' | 'detail'>('browse');

  useEffect(() => {
    const applyHashSelection = (): void => {
      const hash = window.location.hash;
      if (!hash.startsWith('#fillings/')) {
        return;
      }
      const rawId = hash.slice('#fillings/'.length);
      if (rawId.length === 0) {
        return;
      }
      setSelectedId(rawId as FillingId);
      setViewMode('detail');
    };

    applyHashSelection();
    window.addEventListener('hashchange', applyHashSelection);
    return () => window.removeEventListener('hashchange', applyHashSelection);
  }, [filters]);

  const handleSelect = (id: string): void => {
    setSelectedId(id as FillingId);
    setViewMode('detail');
  };

  const handleBack = (): void => {
    setViewMode('browse');
    setSelectedId(null);
  };

  if (viewMode === 'detail' && selectedId) {
    return <DetailView fillingId={selectedId} onBack={handleBack} />;
  }

  return <BrowseView filters={filters} selectedId={selectedId} onSelect={handleSelect} />;
}
