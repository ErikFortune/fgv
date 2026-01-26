/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useState } from 'react';
import type { IngredientId } from '@fgv/ts-chocolate';
import { BrowseTools } from '@fgv/ts-chocolate-ui';
import { IngredientsToolSidebar, type IIngredientFilters } from './IngredientsToolSidebar';
import { BrowseView } from './views/BrowseView';
import { DetailView } from './views/DetailView';

/**
 * Default filter state
 */
const defaultFilters: IIngredientFilters = {
  search: '',
  categories: [],
  collections: [],
  tags: []
};

/**
 * Props for the IngredientsTool component
 */
export interface IIngredientsToolProps {
  /** Filter state */
  filters: IIngredientFilters;
}

/**
 * Main ingredients tool component
 */
export function IngredientsTool({ filters }: IIngredientsToolProps): React.ReactElement {
  const { state, actions } = BrowseTools.useBrowseDetailState<IngredientId>();

  if (state.viewMode === 'detail' && state.selectedId) {
    return <DetailView ingredientId={state.selectedId} onBack={actions.back} />;
  }

  return <BrowseView filters={filters} selectedId={state.selectedId} onSelect={actions.select} />;
}

/**
 * Get the sidebar component for the ingredients tool.
 * This hook provides integrated filter state management for legacy usage patterns.
 */
export function useIngredientsToolSidebar(): {
  sidebar: React.ReactElement;
  filters: IIngredientFilters;
  setFilters: (filters: IIngredientFilters) => void;
} {
  const [filters, setFilters] = useState<IIngredientFilters>(defaultFilters);

  const sidebar = <IngredientsToolSidebar filters={filters} onFiltersChange={setFilters} />;

  return { sidebar, filters, setFilters };
}

// Re-export types
export type { IIngredientFilters } from './IngredientsToolSidebar';
