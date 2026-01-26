/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useEffect } from 'react';
import type { FillingId } from '@fgv/ts-chocolate';
import { BrowseTools } from '@fgv/ts-chocolate-ui';
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
  const { state, actions } = BrowseTools.useBrowseDetailState<FillingId>();
  const { currentId, setId } = BrowseTools.useHashNavigation<FillingId>({ prefix: 'fillings' });

  // Sync hash navigation to browse/detail state
  useEffect(() => {
    if (currentId) {
      actions.select(currentId);
    }
  }, [currentId, actions]);

  const handleSelect = (id: string): void => {
    setId(id as FillingId);
    actions.select(id as FillingId);
  };

  const handleBack = (): void => {
    setId(null);
    actions.back();
  };

  if (state.viewMode === 'detail' && state.selectedId) {
    return <DetailView fillingId={state.selectedId} onBack={handleBack} />;
  }

  return <BrowseView filters={filters} selectedId={state.selectedId} onSelect={handleSelect} />;
}
