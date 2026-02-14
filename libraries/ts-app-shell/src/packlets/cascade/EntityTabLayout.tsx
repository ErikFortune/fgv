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
 * EntityTabLayout — shared layout for entity tab content with list + cascade + collapse-on-focus.
 * @packageDocumentation
 */

import React from 'react';

import { CascadeContainer, type ICascadeColumn } from './CascadeContainer';
import { ComparisonView, type IComparisonColumn } from './ComparisonView';

// ============================================================================
// EntityTabLayout Props
// ============================================================================

/**
 * Props for the EntityTabLayout component.
 * @public
 */
export interface IEntityTabLayoutProps {
  /** The entity list content (rendered in the collapsible left panel) */
  readonly list: React.ReactNode;
  /** Cascade columns to display (empty array = no cascade) */
  readonly cascadeColumns: ReadonlyArray<ICascadeColumn>;
  /** Callback to pop the cascade back to a specific depth (0 = clear all) */
  readonly onPopTo: (depth: number) => void;
  /** Whether the entity list is currently collapsed */
  readonly listCollapsed: boolean;
  /** Callback to collapse the entity list (fired when user clicks inside cascade) */
  readonly onListCollapse: () => void;
  /** Whether compare mode is active */
  readonly compareMode?: boolean;
  /** Columns for the comparison view (when compare mode is active with 2+ selections) */
  readonly comparisonColumns?: ReadonlyArray<IComparisonColumn>;
  /** Whether the comparison view is actively showing (user explicitly triggered) */
  readonly showingComparison?: boolean;
  /** Callback to exit the comparison view (back to selection list) */
  readonly onExitComparison?: () => void;
  /** Columns for variation comparison (when comparing variations of a single recipe) */
  readonly variationCompareColumns?: ReadonlyArray<IComparisonColumn>;
  /** Callback to exit variation comparison mode */
  readonly onExitVariationCompare?: () => void;
}

// ============================================================================
// EntityTabLayout Component
// ============================================================================

/**
 * Shared layout for entity tab content.
 *
 * Renders an entity list on the left and a cascade container on the right.
 * The list stays expanded while browsing (selecting items in the list).
 * It collapses when the user clicks inside the cascade detail pane,
 * signaling they are focused on the detail rather than browsing.
 *
 * @public
 */
export function EntityTabLayout(props: IEntityTabLayoutProps): React.ReactElement {
  const { list, cascadeColumns, onPopTo, listCollapsed, onListCollapse, compareMode, comparisonColumns } =
    props;

  const variationCompareColumns = props.variationCompareColumns;
  const onExitVariationCompare = props.onExitVariationCompare;
  const showingComparison = props.showingComparison ?? false;
  const onExitComparison = props.onExitComparison;

  const isVariationCompare = variationCompareColumns !== undefined && variationCompareColumns.length >= 2;
  const showComparison =
    !isVariationCompare &&
    showingComparison &&
    comparisonColumns !== undefined &&
    comparisonColumns.length >= 2;
  const showCascade = !compareMode && !isVariationCompare && !showComparison && cascadeColumns.length > 0;
  const hasCascadeOrCompare = cascadeColumns.length > 0 || showComparison;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Variation compare banner */}
      {isVariationCompare && onExitVariationCompare && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border-b border-amber-200 shrink-0">
          <span className="text-xs text-amber-700">
            Comparing {variationCompareColumns.length} variations
          </span>
          <button
            onClick={onExitVariationCompare}
            className="px-2 py-0.5 text-xs rounded border border-amber-300 text-amber-700 hover:bg-amber-100 transition-colors"
          >
            Exit
          </button>
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Entity list — proportional width when cascade is showing, full width when browsing */}
        <div
          className={`flex flex-col overflow-hidden transition-all ${
            isVariationCompare || showComparison
              ? 'w-0 min-w-0'
              : listCollapsed
              ? 'w-0 min-w-0'
              : hasCascadeOrCompare
              ? 'w-1/4 max-w-xs shrink-0 border-r border-gray-200'
              : 'w-full max-w-sm shrink-0 border-r border-gray-200'
          }`}
        >
          {list}
        </div>

        {/* Cascade columns (normal mode) */}
        {showCascade && (
          <CascadeContainer columns={cascadeColumns} onPopTo={onPopTo} onFocus={onListCollapse} />
        )}

        {/* Entity comparison view (compare mode — explicitly triggered) */}
        {showComparison && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border-b border-blue-200 shrink-0">
              <span className="text-xs text-blue-700">Comparing {comparisonColumns.length} items</span>
              {onExitComparison && (
                <button
                  onClick={onExitComparison}
                  className="px-2 py-0.5 text-xs rounded border border-blue-300 text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  ← Back to list
                </button>
              )}
            </div>
            <ComparisonView columns={comparisonColumns} />
          </div>
        )}

        {/* Variation comparison view */}
        {isVariationCompare && <ComparisonView columns={variationCompareColumns} />}
      </div>
    </div>
  );
}
