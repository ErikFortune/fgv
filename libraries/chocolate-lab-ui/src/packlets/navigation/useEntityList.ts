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
 * Hook for deriving a sorted entity array and selected entity ID from the cascade stack.
 *
 * @packageDocumentation
 */

import { useMemo } from 'react';

import type { CascadeEntityType, ICascadeEntry } from './model';

// ============================================================================
// Types
// ============================================================================

/**
 * Options for {@link useEntityList}.
 * @public
 */
export interface IEntityListOptions<TEntity> {
  /** Function to retrieve all entities from the workspace data. */
  readonly getAll: () => Iterable<TEntity>;
  /** Sort comparator for the entity list. */
  readonly compare: (a: TEntity, b: TEntity) => number;
  /** The entity type string to match in the cascade stack for selectedId derivation. */
  readonly entityType: CascadeEntityType;
  /** The cascade stack from navigation state. */
  readonly cascadeStack: ReadonlyArray<ICascadeEntry>;
  /** Memo dependencies for the entity list (typically `[workspace, reactiveWorkspace.version]`). */
  readonly deps: ReadonlyArray<unknown>;
}

/**
 * Result from {@link useEntityList}.
 * @public
 */
export interface IEntityListResult<TEntity, TId extends string> {
  /** Sorted array of all entities. */
  readonly entities: ReadonlyArray<TEntity>;
  /** ID of the currently selected entity (first cascade entry matching the entity type), or undefined. */
  readonly selectedId: TId | undefined;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Derives a sorted entity array and the currently selected entity ID from the cascade stack.
 *
 * @public
 */
export function useEntityList<TEntity, TId extends string>(
  options: IEntityListOptions<TEntity>
): IEntityListResult<TEntity, TId> {
  const { getAll, compare, entityType, cascadeStack, deps } = options;

  const entities = useMemo<ReadonlyArray<TEntity>>(
    () => Array.from(getAll()).sort(compare),
    // Deps are caller-provided to match the memoization pattern used throughout the tab components.
    deps
  );

  const selectedId =
    cascadeStack.length > 0 && cascadeStack[0].entityType === entityType
      ? (cascadeStack[0].entityId as TId)
      : undefined;

  return { entities, selectedId };
}
