/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useState } from 'react';
import type { RecipeId } from '@fgv/ts-chocolate';
import { BrowseView } from './views/BrowseView';
import { DetailView } from './views/DetailView';
import type { IRecipeFilters } from './RecipesToolSidebar';

/**
 * Props for the RecipesTool component
 */
export interface IRecipesToolProps {
  /** Current filters (passed from App) */
  filters: IRecipeFilters;
}

/**
 * Recipes tool with browse and detail views
 */
export function RecipesTool({ filters }: IRecipesToolProps): React.ReactElement {
  const [selectedId, setSelectedId] = useState<RecipeId | null>(null);
  const [viewMode, setViewMode] = useState<'browse' | 'detail'>('browse');

  const handleSelect = (id: string): void => {
    setSelectedId(id as RecipeId);
    setViewMode('detail');
  };

  const handleBack = (): void => {
    setViewMode('browse');
    setSelectedId(null);
  };

  if (viewMode === 'detail' && selectedId) {
    return <DetailView recipeId={selectedId} onBack={handleBack} />;
  }

  return <BrowseView filters={filters} selectedId={selectedId} onSelect={handleSelect} />;
}
