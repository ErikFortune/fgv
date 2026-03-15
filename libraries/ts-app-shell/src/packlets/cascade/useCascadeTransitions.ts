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
 * Shared cascade transition hooks for entity tabs.
 *
 * @packageDocumentation
 */

import { useCallback } from 'react';

import type { ICascadeEntryBase } from './model';

/**
 * Returns a depth-aware squash helper used by cascade views.
 *
 * Keeps stack entries up to and including `depth`, then appends `entry`.
 *
 * @public
 */
export function useSquashAt(
  cascadeStack: ReadonlyArray<ICascadeEntryBase>,
  squashCascade: (entries: ReadonlyArray<ICascadeEntryBase>) => void
): (depth: number, entry: ICascadeEntryBase) => void {
  return useCallback(
    (depth: number, entry: ICascadeEntryBase): void => {
      squashCascade([...cascadeStack.slice(0, depth + 1), entry]);
    },
    [cascadeStack, squashCascade]
  );
}

/**
 * Returns a shared drill-down toggle helper for cascade columns.
 *
 * If the target entry is already immediately to the right of `depth`, it collapses
 * back to `depth`. Otherwise, it appends a new view entry at `depth + 1`.
 *
 * @public
 */
export function useCascadeDrillDown(
  cascadeStack: ReadonlyArray<ICascadeEntryBase>,
  squashCascade: (entries: ReadonlyArray<ICascadeEntryBase>) => void,
  squashAt: (depth: number, entry: ICascadeEntryBase) => void
): (depth: number, entityType: string, entityId: string, extra?: Partial<ICascadeEntryBase>) => void {
  return useCallback(
    (depth: number, entityType: string, entityId: string, extra?: Partial<ICascadeEntryBase>): void => {
      const nextEntry = cascadeStack[depth + 1];
      if (nextEntry?.entityType === entityType && nextEntry.entityId === entityId) {
        squashCascade(cascadeStack.slice(0, depth + 1));
        return;
      }
      squashAt(depth, { entityType, entityId, mode: 'view', ...extra });
    },
    [cascadeStack, squashAt, squashCascade]
  );
}
