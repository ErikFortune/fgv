/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const applyHashSelection = (): void => {
      const hash = window.location.hash;
      if (!hash.startsWith('#procedures/')) {
        return;
      }
      const rawId = hash.slice('#procedures/'.length);
      if (rawId.length === 0) {
        return;
      }
      setSelectedId(rawId as ProcedureId);
      setViewMode('detail');
    };

    applyHashSelection();
    window.addEventListener('hashchange', applyHashSelection);
    return () => window.removeEventListener('hashchange', applyHashSelection);
  }, [filters]);

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
