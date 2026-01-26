/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import type { MoldId } from '@fgv/ts-chocolate';
import { BrowseTools } from '@fgv/ts-chocolate-ui';
import { BrowseView } from './views/BrowseView';
import { DetailView } from './views/DetailView';
import type { IMoldFilters } from './MoldsToolSidebar';

export interface IMoldsToolProps {
  filters: IMoldFilters;
}

export function MoldsTool({ filters }: IMoldsToolProps): React.ReactElement {
  const { state, actions } = BrowseTools.useBrowseDetailState<MoldId>();

  if (state.viewMode === 'detail' && state.selectedId) {
    return <DetailView moldId={state.selectedId} onBack={actions.back} />;
  }

  return <BrowseView filters={filters} selectedId={state.selectedId} onSelect={actions.select} />;
}
