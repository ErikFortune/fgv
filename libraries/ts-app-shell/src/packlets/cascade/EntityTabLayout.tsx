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
  const { list, cascadeColumns, onPopTo, listCollapsed, onListCollapse } = props;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Entity list (collapses when user focuses into detail pane) */}
      <div
        className={`flex flex-col overflow-hidden transition-all ${listCollapsed ? 'w-0 min-w-0' : 'flex-1'}`}
      >
        {list}
      </div>

      {/* Cascade columns */}
      {cascadeColumns.length > 0 && (
        <CascadeContainer columns={cascadeColumns} onPopTo={onPopTo} onFocus={onListCollapse} />
      )}
    </div>
  );
}
