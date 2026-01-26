/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useEffect } from 'react';
import type { ProcedureId } from '@fgv/ts-chocolate';
import { BrowseTools } from '@fgv/ts-chocolate-ui';
import type { IProcedureFilters } from './ProceduresToolSidebar';
import { BrowseView } from './views/BrowseView';
import { DetailView } from './views/DetailView';

/**
 * Procedures tool
 */
export interface IProceduresToolProps {
  filters: IProcedureFilters;
}

export function ProceduresTool({ filters }: IProceduresToolProps): React.ReactElement {
  const { state, actions } = BrowseTools.useBrowseDetailState<ProcedureId>();
  const { currentId, setId } = BrowseTools.useHashNavigation<ProcedureId>({ prefix: 'procedures' });

  // Sync hash navigation to browse/detail state
  useEffect(() => {
    if (currentId) {
      actions.select(currentId);
    }
  }, [currentId, actions]);

  const handleSelect = (id: ProcedureId): void => {
    setId(id);
    actions.select(id);
  };

  const handleBack = (): void => {
    setId(null);
    actions.back();
  };

  if (state.viewMode === 'detail' && state.selectedId) {
    return <DetailView procedureId={state.selectedId} onBack={handleBack} />;
  }

  return <BrowseView filters={filters} selectedId={state.selectedId} onSelect={handleSelect} />;
}
