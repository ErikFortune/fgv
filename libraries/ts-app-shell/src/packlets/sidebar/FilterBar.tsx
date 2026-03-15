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

import React from 'react';

import { SearchBar, type ISearchBarProps } from './SearchBar';

/**
 * Props for the FilterBar component.
 * @public
 */
export interface IFilterBarProps {
  /** Search bar props */
  readonly search: ISearchBarProps;
  /** Total number of active filters across all filter rows */
  readonly activeFilterCount: number;
  /** Callback to clear all filters (search + all filter rows) */
  readonly onClearAll: () => void;
  /** Filter row children (FilterRow components) */
  readonly children: React.ReactNode;
}

/**
 * Composite sidebar filter bar: search input + filter rows + clear-all.
 *
 * Renders the search bar at the top, filter rows in the middle,
 * and a "Clear all" button when any filters are active.
 *
 * @public
 */
export function FilterBar(props: IFilterBarProps): React.ReactElement {
  const { search, activeFilterCount, onClearAll, children } = props;

  const hasActiveFilters = activeFilterCount > 0 || search.value.length > 0;

  return (
    <div className="flex flex-col">
      {/* Search */}
      <SearchBar {...search} />

      {/* Filter header with clear-all */}
      <div className="flex items-center justify-between px-3 py-1">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Filters</span>
        {hasActiveFilters && (
          <button onClick={onClearAll} className="text-xs text-choco-accent hover:text-choco-primary">
            Clear all
          </button>
        )}
      </div>

      {/* Filter rows */}
      <div className="flex flex-col">{children}</div>
    </div>
  );
}
