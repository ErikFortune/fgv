/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useState } from 'react';
import type { ProcedureId } from '@fgv/ts-chocolate';
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
  const [selectedId, setSelectedId] = useState<ProcedureId | null>(null);
  const [viewMode, setViewMode] = useState<'browse' | 'detail'>('browse');

  const handleSelect = (id: ProcedureId): void => {
    setSelectedId(id);
    setViewMode('detail');
  };

  const handleBack = (): void => {
    setViewMode('browse');
    setSelectedId(null);
  };

  if (viewMode === 'detail' && selectedId) {
    return <DetailView procedureId={selectedId} onBack={handleBack} />;
  }

  return <BrowseView filters={filters} selectedId={selectedId} onSelect={handleSelect} />;
}
