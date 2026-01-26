/*
 * MIT License
 * Copyright (c) 2026 Erik Fortune
 */

import * as React from 'react';
import type { TaskId } from '@fgv/ts-chocolate';
import { BrowseTools } from '@fgv/ts-chocolate-ui';
import type { ITaskFilters } from './TasksToolSidebar';
import { BrowseView } from './views/BrowseView';
import { DetailView } from './views/DetailView';

export interface ITasksToolProps {
  filters: ITaskFilters;
}

export function TasksTool({ filters }: ITasksToolProps): React.ReactElement {
  const { state, actions } = BrowseTools.useBrowseDetailState<TaskId>();

  if (state.viewMode === 'detail' && state.selectedId) {
    return <DetailView taskId={state.selectedId} onBack={actions.back} />;
  }

  return <BrowseView filters={filters} selectedId={state.selectedId} onSelect={actions.select} />;
}
