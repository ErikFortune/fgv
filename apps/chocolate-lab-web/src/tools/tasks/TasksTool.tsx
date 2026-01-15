/*
 * MIT License
 * Copyright (c) 2026 Erik Fortune
 */

import * as React from 'react';
import { useState } from 'react';
import type { TaskId } from '@fgv/ts-chocolate';
import type { ITaskFilters } from './TasksToolSidebar';
import { BrowseView } from './views/BrowseView';
import { DetailView } from './views/DetailView';

export interface ITasksToolProps {
  filters: ITaskFilters;
}

export function TasksTool({ filters }: ITasksToolProps): React.ReactElement {
  const [selectedId, setSelectedId] = useState<TaskId | null>(null);
  const [viewMode, setViewMode] = useState<'browse' | 'detail'>('browse');

  const handleSelect = (id: TaskId): void => {
    setSelectedId(id);
    setViewMode('detail');
  };

  const handleBack = (): void => {
    setViewMode('browse');
    setSelectedId(null);
  };

  if (viewMode === 'detail' && selectedId) {
    return <DetailView taskId={selectedId} onBack={handleBack} />;
  }

  return <BrowseView filters={filters} selectedId={selectedId} onSelect={handleSelect} />;
}
