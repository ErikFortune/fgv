/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useState } from 'react';
import type { MoldId } from '@fgv/ts-chocolate';
import { BrowseView } from './views/BrowseView';
import { DetailView } from './views/DetailView';
import type { IMoldFilters } from './MoldsToolSidebar';

export interface IMoldsToolProps {
  filters: IMoldFilters;
}

export function MoldsTool({ filters }: IMoldsToolProps): React.ReactElement {
  const [selectedId, setSelectedId] = useState<MoldId | null>(null);
  const [viewMode, setViewMode] = useState<'browse' | 'detail'>('browse');

  const handleSelect = (id: MoldId): void => {
    setSelectedId(id);
    setViewMode('detail');
  };

  const handleBack = (): void => {
    setViewMode('browse');
    setSelectedId(null);
  };

  if (viewMode === 'detail' && selectedId) {
    return <DetailView moldId={selectedId} onBack={handleBack} />;
  }

  return <BrowseView filters={filters} selectedId={selectedId} onSelect={handleSelect} />;
}
