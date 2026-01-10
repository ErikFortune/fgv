/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useState, useCallback } from 'react';
import { IngredientsToolSidebar, type IIngredientFilters } from './IngredientsToolSidebar';
import { BrowseView } from './views/BrowseView';
import { DetailView } from './views/DetailView';
import type { IngredientId } from '@fgv/ts-chocolate';

/**
 * View mode for the ingredients tool
 */
type ViewMode = 'browse' | 'detail';

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
  /** Additional CSS classes */
  className?: string;
}

/**
 * State for the IngredientsTool
 */
interface IIngredientsToolState {
  viewMode: ViewMode;
  selectedId: IngredientId | null;
  filters: IIngredientFilters;
}

/**
 * Main ingredients tool component
 */
export function IngredientsTool({ className = '' }: IIngredientsToolProps): React.ReactElement {
  const [state, setState] = useState<IIngredientsToolState>({
    viewMode: 'browse',
    selectedId: null,
    filters: defaultFilters
  });

  // Handle ingredient selection
  const handleSelect = useCallback((id: IngredientId) => {
    setState((prev) => ({
      ...prev,
      viewMode: 'detail',
      selectedId: id
    }));
  }, []);

  // Handle back to browse
  const handleBack = useCallback(() => {
    setState((prev) => ({
      ...prev,
      viewMode: 'browse',
      selectedId: null
    }));
  }, []);

  // Handle filter changes
  const handleFiltersChange = useCallback((filters: IIngredientFilters) => {
    setState((prev) => ({
      ...prev,
      filters
    }));
  }, []);

  return (
    <div className={className}>
      {state.viewMode === 'browse' ? (
        <BrowseView filters={state.filters} selectedId={state.selectedId} onSelect={handleSelect} />
      ) : state.selectedId ? (
        <DetailView ingredientId={state.selectedId} onBack={handleBack} />
      ) : null}
    </div>
  );
}

/**
 * Get the sidebar component for the ingredients tool
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
