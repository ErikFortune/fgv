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
 * Chocolate-specific filter configurations per tab.
 *
 * Defines which filter rows appear in the sidebar for each entity type,
 * using the generic `IFilterOption` type from ts-app-shell.
 *
 * @packageDocumentation
 */

import { type AppTab } from '../navigation';

// ============================================================================
// Filter Definition
// ============================================================================

/**
 * Describes a named filter row for a specific tab.
 * The `key` is used to store selections in `IFilterState.selections`.
 * @public
 */
export interface IFilterDefinition {
  /** Storage key in IFilterState.selections */
  readonly key: string;
  /** Display label for the filter row */
  readonly label: string;
  /** Whether multiple values can be selected (default: true) */
  readonly multiple?: boolean;
}

// ============================================================================
// Per-Tab Filter Definitions
// ============================================================================

/**
 * Filter definitions for each tab.
 * Tabs with no filters (e.g., journal) have an empty array.
 * @public
 */
export const TAB_FILTER_DEFINITIONS: Record<AppTab, ReadonlyArray<IFilterDefinition>> = {
  // Library tabs
  ingredients: [
    { key: 'category', label: 'Category' },
    { key: 'tags', label: 'Tags' }
  ],
  fillings: [
    { key: 'category', label: 'Category' },
    { key: 'tags', label: 'Tags' },
    { key: 'chocolate', label: 'Chocolate', multiple: false }
  ],
  confections: [
    { key: 'category', label: 'Category' },
    { key: 'tags', label: 'Tags' },
    { key: 'mold', label: 'Mold' },
    { key: 'chocolate', label: 'Chocolate', multiple: false }
  ],
  molds: [
    { key: 'shape', label: 'Shape' },
    { key: 'cavities', label: 'Cavities', multiple: false }
  ],
  tasks: [{ key: 'category', label: 'Category' }],
  procedures: [
    { key: 'category', label: 'Category' },
    { key: 'tags', label: 'Tags' }
  ],

  // Production tabs
  sessions: [{ key: 'status', label: 'Status', multiple: false }],
  journal: [],
  'ingredient-inventory': [
    { key: 'category', label: 'Category' },
    { key: 'location', label: 'Location' }
  ],
  'mold-inventory': [
    { key: 'shape', label: 'Shape' },
    { key: 'available', label: 'Availability', multiple: false }
  ]
} as const;
