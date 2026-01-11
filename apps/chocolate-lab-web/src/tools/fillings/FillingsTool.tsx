/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useState } from 'react';
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
