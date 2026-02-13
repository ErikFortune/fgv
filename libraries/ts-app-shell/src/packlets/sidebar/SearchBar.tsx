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

/**
 * Props for the SearchBar component.
 * @public
 */
export interface ISearchBarProps {
  /** Current search query */
  readonly value: string;
  /** Callback when the search query changes */
  readonly onChange: (value: string) => void;
  /** Placeholder text (default: 'Search...') */
  readonly placeholder?: string;
}

/**
 * Search input bar for the sidebar.
 * @public
 */
export function SearchBar(props: ISearchBarProps): React.ReactElement {
  const { value, onChange, placeholder = 'Search...' } = props;

  return (
    <div className="px-3 py-2">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e): void => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-3 pr-8 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-choco-accent focus:border-choco-accent"
        />
        {value.length > 0 && (
          <button
            onClick={(): void => onChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            aria-label="Clear search"
          >
            &times;
          </button>
        )}
      </div>
    </div>
  );
}
