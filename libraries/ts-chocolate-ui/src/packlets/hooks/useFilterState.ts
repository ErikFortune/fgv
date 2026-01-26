/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import { useCallback, useMemo, useState } from 'react';

/**
 * Base filter state that all filter configurations extend.
 * Provides the common fields used across all tool sidebars.
 * @public
 */
export interface IBaseFilterState {
  /**
   * Search text filter
   */
  search: string;
  /**
   * Selected collection IDs to filter by
   */
  collections: string[];
  /**
   * Selected tags to filter by
   */
  tags: string[];
}

/**
 * Actions for managing filter state
 * @public
 */
export interface IFilterActions<TFilters extends IBaseFilterState> {
  /**
   * Update the search text
   */
  setSearch: (search: string) => void;
  /**
   * Toggle a collection filter on/off
   */
  toggleCollection: (collectionId: string) => void;
  /**
   * Toggle a tag filter on/off
   */
  toggleTag: (tag: string) => void;
  /**
   * Clear all filters to initial state
   */
  clearFilters: () => void;
  /**
   * Replace all filters at once
   */
  setFilters: (filters: TFilters) => void;
  /**
   * Whether any filters are currently active
   */
  hasActiveFilters: boolean;
}

/**
 * Return type for useFilterState hook
 * @public
 */
export interface IUseFilterStateResult<TFilters extends IBaseFilterState> {
  state: TFilters;
  actions: IFilterActions<TFilters>;
}

/**
 * Creates initial filter state with empty values
 * @public
 */
export function createInitialFilterState(): IBaseFilterState {
  return {
    search: '',
    collections: [],
    tags: []
  };
}

/**
 * Hook for managing filter state in tool sidebars.
 *
 * Provides a consistent pattern for filtering across all tools.
 * Supports search, collection, and tag filtering with easy extension
 * for tool-specific filters.
 *
 * @example
 * ```tsx
 * // Basic usage
 * function MySidebar() {
 *   const { state, actions } = useFilterState(createInitialFilterState());
 *
 *   return (
 *     <div>
 *       <SearchInput
 *         value={state.search}
 *         onChange={actions.setSearch}
 *       />
 *       {tags.map(tag => (
 *         <TagBadge
 *           key={tag}
 *           tag={tag}
 *           isActive={state.tags.includes(tag)}
 *           onClick={() => actions.toggleTag(tag)}
 *         />
 *       ))}
 *       {actions.hasActiveFilters && (
 *         <button onClick={actions.clearFilters}>Clear</button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Extended filters for specific tools
 * interface IIngredientFilters extends IBaseFilterState {
 *   category: IngredientCategory | null;
 * }
 *
 * const initialFilters: IIngredientFilters = {
 *   ...createInitialFilterState(),
 *   category: null
 * };
 *
 * const { state, actions } = useFilterState(initialFilters);
 * ```
 *
 * @param initialFilters - Initial filter values
 * @returns Object containing filter state and actions
 * @public
 */
export function useFilterState<TFilters extends IBaseFilterState>(
  initialFilters: TFilters
): IUseFilterStateResult<TFilters> {
  const [filters, setFilters] = useState<TFilters>(initialFilters);

  const setSearch = useCallback((search: string): void => {
    setFilters((prev) => ({ ...prev, search }));
  }, []);

  const toggleCollection = useCallback((collectionId: string): void => {
    setFilters((prev) => {
      const next = prev.collections.includes(collectionId)
        ? prev.collections.filter((c) => c !== collectionId)
        : [...prev.collections, collectionId];
      return { ...prev, collections: next };
    });
  }, []);

  const toggleTag = useCallback((tag: string): void => {
    setFilters((prev) => {
      const next = prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag];
      return { ...prev, tags: next };
    });
  }, []);

  const clearFilters = useCallback((): void => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const hasActiveFilters = useMemo((): boolean => {
    return filters.search.length > 0 || filters.collections.length > 0 || filters.tags.length > 0;
  }, [filters.search, filters.collections, filters.tags]);

  return {
    state: filters,
    actions: {
      setSearch,
      toggleCollection,
      toggleTag,
      clearFilters,
      setFilters,
      hasActiveFilters
    }
  };
}
