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
 * Hook that finds the default or first mutable collection ID from an entity collection map.
 *
 * @packageDocumentation
 */

import { useMemo } from 'react';

import type { CollectionId } from '@fgv/ts-chocolate';

// ============================================================================
// Types
// ============================================================================

/**
 * Minimal interface for a collection map that supports iteration.
 * @public
 */
export interface ICollectionMap {
  entries(): IterableIterator<[string, { readonly isMutable: boolean }]>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Finds the default or first mutable collection ID from an entity collection map.
 * If `preferredId` is provided and refers to a mutable collection, it is returned.
 * Otherwise returns the first mutable collection, or undefined if none exists.
 *
 * @param collections - The entity collection map to search.
 * @param deps - Memo dependencies (typically `[workspace, reactiveWorkspace.version]`).
 * @param preferredId - Optional preferred collection ID (e.g. from settings default targets).
 * @public
 */
export function useMutableCollection(
  collections: ICollectionMap,
  deps: ReadonlyArray<unknown>,
  preferredId?: string
): CollectionId | undefined {
  return useMemo<CollectionId | undefined>(
    () => {
      let firstMutable: CollectionId | undefined;
      for (const [id, col] of collections.entries()) {
        if (col.isMutable) {
          if (preferredId !== undefined && id === preferredId) {
            return id as CollectionId;
          }
          if (firstMutable === undefined) {
            firstMutable = id as CollectionId;
          }
        }
      }
      return firstMutable;
    },
    // Deps are caller-provided to match the memoization pattern used throughout the tab components.
    [...deps, preferredId]
  );
}

/**
 * Returns a predicate that returns true if a composite entity ID (collectionId.baseId)
 * belongs to a mutable collection. Use this for `canDelete` in EntityList.
 *
 * @param collections - The entity collection map to check against.
 * @param deps - Memo dependencies (typically `[workspace, reactiveWorkspace.version]`).
 * @public
 */
export function useCanDeleteFromCollections(
  collections: ICollectionMap,
  deps: ReadonlyArray<unknown>
): (compositeId: string) => boolean {
  return useMemo<(compositeId: string) => boolean>(
    () =>
      (compositeId: string): boolean => {
        const collectionId = compositeId.split('.')[0];
        if (collectionId === undefined) return false;
        for (const [id, col] of collections.entries()) {
          if (id === collectionId) return col.isMutable;
        }
        return false;
      },
    deps
  );
}
