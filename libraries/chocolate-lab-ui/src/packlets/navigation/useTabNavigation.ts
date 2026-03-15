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
 * Hook that bundles all navigation state and workspace hooks used by entity tabs.
 *
 * Every entity tab extracts the same set of navigation store selectors and workspace hooks.
 * This hook eliminates that boilerplate by returning them as a single object.
 *
 * @packageDocumentation
 */

import type { IWorkspace } from '@fgv/ts-chocolate';

import type { ICascadeEntry } from './model';
import { useNavigationStore } from './store';
import type { ReactiveWorkspace } from '../workspace';
import { useWorkspace, useReactiveWorkspace } from '../workspace';

// ============================================================================
// Types
// ============================================================================

/**
 * All navigation state and actions needed by entity tabs.
 * @public
 */
export interface ITabNavigation {
  /** The underlying workspace data. */
  readonly workspace: IWorkspace;
  /** The reactive workspace for mutations and version tracking. */
  readonly reactiveWorkspace: ReactiveWorkspace;
  /** Replace the cascade stack atomically. */
  readonly squashCascade: (entries: ReadonlyArray<ICascadeEntry>) => void;
  /** Pop the cascade stack back to a specific depth. */
  readonly popCascadeTo: (depth: number) => void;
  /** The current cascade stack (ordered left-to-right). */
  readonly cascadeStack: ReadonlyArray<ICascadeEntry>;
  /** Whether the entity list is collapsed. */
  readonly listCollapsed: boolean;
  /** Collapse the entity list (focus into detail pane). */
  readonly collapseList: () => void;
  /** Whether compare mode is active. */
  readonly compareMode: boolean;
  /** Entity IDs selected for comparison. */
  readonly compareIds: ReadonlySet<string>;
  /** Toggle compare mode on/off. */
  readonly toggleCompareMode: () => void;
  /** Toggle an entity ID in/out of the compare selection. */
  readonly toggleCompareId: (id: string) => void;
  /** Whether the comparison view is actively showing. */
  readonly showingComparison: boolean;
  /** Start showing the comparison view. */
  readonly startComparison: () => void;
  /** Exit the comparison view. */
  readonly exitComparison: () => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Bundles all navigation state and workspace hooks used by every entity tab.
 * Eliminates ~17 lines of identical boilerplate per tab.
 *
 * @public
 */
export function useTabNavigation(): ITabNavigation {
  const workspace = useWorkspace();
  const reactiveWorkspace = useReactiveWorkspace();
  return {
    workspace,
    reactiveWorkspace,
    squashCascade: useNavigationStore((s) => s.squashCascade),
    popCascadeTo: useNavigationStore((s) => s.popCascadeTo),
    cascadeStack: useNavigationStore((s) => s.cascadeStack),
    listCollapsed: useNavigationStore((s) => s.listCollapsed),
    collapseList: useNavigationStore((s) => s.collapseList),
    compareMode: useNavigationStore((s) => s.compareMode),
    compareIds: useNavigationStore((s) => s.compareIds),
    toggleCompareMode: useNavigationStore((s) => s.toggleCompareMode),
    toggleCompareId: useNavigationStore((s) => s.toggleCompareId),
    showingComparison: useNavigationStore((s) => s.showingComparison),
    startComparison: useNavigationStore((s) => s.startComparison),
    exitComparison: useNavigationStore((s) => s.exitComparison)
  };
}
