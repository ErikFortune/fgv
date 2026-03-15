/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Hook for filtering entity arrays by search text and sidebar filter selections.
 *
 * @packageDocumentation
 */

import { useMemo } from 'react';

import {
  type ICollectionVisibility,
  type IFilterState,
  isCollectionVisible,
  useNavigationStore,
  selectCurrentFilter,
  selectCurrentCollectionVisibility
} from '../navigation';

// ============================================================================
// Filter Spec
// ============================================================================

/**
 * Describes how to extract filterable properties from an entity type.
 * Each key in `selectionExtractors` corresponds to a filter key in IFilterState.selections.
 *
 * @public
 */
export interface IEntityFilterSpec<TEntity> {
  /** Extract searchable text from the entity (matched against filterState.search) */
  readonly getSearchText: (entity: TEntity) => string;
  /**
   * Map of filter key → extractor function.
   * The extractor returns the value(s) for that filter key from the entity.
   * A string return means a single value; string[] means multiple (e.g., tags).
   */
  readonly selectionExtractors: Readonly<
    Record<string, (entity: TEntity) => string | ReadonlyArray<string> | undefined>
  >;
  /**
   * Optional: extract the collection ID from an entity.
   * When provided, entities from hidden collections are excluded before
   * search and selection filters are applied.
   */
  readonly getCollectionId?: (entity: TEntity) => string | undefined;
}

// ============================================================================
// Filtering Logic
// ============================================================================

/**
 * Applies search and selection filters to an entity array.
 */
function applyFilters<TEntity>(
  entities: ReadonlyArray<TEntity>,
  filterState: IFilterState,
  spec: IEntityFilterSpec<TEntity>,
  collectionVisibility: ICollectionVisibility
): ReadonlyArray<TEntity> {
  let result = entities;

  // Apply collection visibility pre-filter
  if (spec.getCollectionId) {
    const extractor = spec.getCollectionId;
    result = result.filter((entity) => {
      const collectionId = extractor(entity);
      return collectionId === undefined || isCollectionVisible(collectionVisibility, collectionId);
    });
  }

  // Apply search filter
  const search = filterState.search.trim().toLowerCase();
  if (search.length > 0) {
    result = result.filter((entity) => spec.getSearchText(entity).toLowerCase().includes(search));
  }

  // Apply selection filters
  for (const [key, selected] of Object.entries(filterState.selections)) {
    if (selected.length === 0) {
      continue;
    }
    const extractor = spec.selectionExtractors[key];
    if (!extractor) {
      continue;
    }
    const selectedSet = new Set(selected);
    result = result.filter((entity) => {
      const value = extractor(entity);
      if (value === undefined) {
        return false;
      }
      if (typeof value === 'string') {
        return selectedSet.has(value);
      }
      // Array: entity matches if any of its values are in the selected set
      return value.some((v) => selectedSet.has(v));
    });
  }

  return result;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Filters an entity array using the current tab's filter state from the navigation store.
 *
 * @param entities - The full entity array
 * @param spec - How to extract filterable properties from each entity
 * @returns The filtered entity array
 *
 * @public
 */
export function useFilteredEntities<TEntity>(
  entities: ReadonlyArray<TEntity>,
  spec: IEntityFilterSpec<TEntity>
): ReadonlyArray<TEntity> {
  const filterState = useNavigationStore(selectCurrentFilter);
  const collectionVisibility = useNavigationStore(selectCurrentCollectionVisibility);

  return useMemo(
    () => applyFilters(entities, filterState, spec, collectionVisibility),
    [entities, filterState, spec, collectionVisibility]
  );
}
