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
 * Hook that finds the first mutable collection ID from an entity collection map.
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
 * Finds the first mutable collection ID from an entity collection map.
 * Returns undefined if no mutable collection exists.
 *
 * @param collections - The entity collection map to search.
 * @param deps - Memo dependencies (typically `[workspace, reactiveWorkspace.version]`).
 * @public
 */
export function useMutableCollection(
  collections: ICollectionMap,
  deps: ReadonlyArray<unknown>
): CollectionId | undefined {
  return useMemo<CollectionId | undefined>(
    () => {
      for (const [id, col] of collections.entries()) {
        if (col.isMutable) {
          return id as CollectionId;
        }
      }
      return undefined;
    },
    // Deps are caller-provided to match the memoization pattern used throughout the tab components.
    deps
  );
}
