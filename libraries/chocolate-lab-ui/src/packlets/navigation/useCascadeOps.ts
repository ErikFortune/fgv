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
 * Semantic cascade operations hook.
 *
 * Encodes cascade navigation rules so tabs declare intent (select, drillDown,
 * openEditor, pop) rather than manually computing cascade stacks.
 *
 * @packageDocumentation
 */

import { useCallback, useMemo } from 'react';

import type { CascadeColumnMode, ICascadeEntry } from './model';
import { useNavigationStore } from './store';

// ============================================================================
// Types
// ============================================================================

/**
 * Describes editors that would be affected by a cascade operation.
 * Returned by {@link ICascadeOps.openEditor} when the operation is blocked.
 * @public
 */
export interface ICascadeConflict {
  readonly conflictingEditors: ReadonlyArray<{ readonly depth: number; readonly entry: ICascadeEntry }>;
}

/**
 * Partial cascade entry for operations that set mode and origin automatically.
 * @public
 */
export type CascadeEntrySpec = Omit<ICascadeEntry, 'mode' | 'origin'> & { readonly mode?: CascadeColumnMode };

/**
 * Semantic cascade operations.
 *
 * These operations encode the cascade navigation rules:
 * 1. Views stack on views
 * 2. Editor replaces its view and trims views above (but not below)
 * 3. Editors never squash editors — blocked if editors exist above target
 * 4. Editors can stack on editors (child above parent is fine)
 * 5. Save/cancel on nested panels pops; on primary panels returns to view
 * 6. Preview behaves like view for all stacking/trimming rules
 * 7. Save/cancel blocked when child editors exist above
 *
 * @public
 */
export interface ICascadeOps {
  /** Replace entire stack with a single view entry (from list selection). */
  readonly select: (entry: CascadeEntrySpec) => void;

  /**
   * Push a view entry after `fromDepth`, trimming anything beyond.
   * Toggle: if the same entity is already at `fromDepth + 1`, collapse instead.
   */
  readonly drillDown: (fromDepth: number, entry: CascadeEntrySpec) => void;

  /**
   * Switch panel at `depth` to edit mode.
   * Trims view/preview panels above `depth`. Blocked if editors/creates exist above.
   * @returns A conflict descriptor if blocked, or `undefined` if the operation succeeded.
   */
  readonly openEditor: (depth: number) => ICascadeConflict | undefined;

  /**
   * Push a nested panel (create or edit) on top of the current stack.
   * Used for typeahead-on-blur creation and sub-entity editing.
   */
  readonly openNested: (fromDepth: number, entry: Omit<ICascadeEntry, 'origin'>) => void;

  /** Pop the topmost entry (for nested save/cancel). Always safe. */
  readonly pop: () => void;

  /**
   * Transition entry at `depth` from edit/create to view mode.
   * Used for primary entity save/cancel.
   */
  readonly popToView: (depth: number, refreshedEntity?: unknown) => void;

  /** Return editors/creates above a given depth. */
  readonly editorsAbove: (
    depth: number
  ) => ReadonlyArray<{ readonly depth: number; readonly entry: ICascadeEntry }>;

  /** Whether any editors/creates exist anywhere in the stack. */
  readonly hasUnsavedEditors: () => boolean;

  /** Whether save/cancel is allowed at `depth` (false if child editors exist above). */
  readonly canSaveOrCancel: (depth: number) => boolean;

  /** Clear the entire cascade stack. */
  readonly clear: () => void;

  /** Clear the cascade if any entry has the given entity ID. */
  readonly clearById: (entityId: string) => void;

  /** Clear the cascade if any entry matches the predicate. */
  readonly clearIf: (predicate: (entry: ICascadeEntry) => boolean) => void;

  /** The current cascade stack (for rendering). */
  readonly stack: ReadonlyArray<ICascadeEntry>;
}

// ============================================================================
// Helpers
// ============================================================================

function isEditOrCreate(mode: CascadeColumnMode): boolean {
  return mode === 'edit' || mode === 'create';
}

function findEditorsAbove(
  stack: ReadonlyArray<ICascadeEntry>,
  depth: number
): ReadonlyArray<{ readonly depth: number; readonly entry: ICascadeEntry }> {
  const result: Array<{ readonly depth: number; readonly entry: ICascadeEntry }> = [];
  for (let i = depth + 1; i < stack.length; i++) {
    if (isEditOrCreate(stack[i].mode)) {
      result.push({ depth: i, entry: stack[i] });
    }
  }
  return result;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook providing semantic cascade operations.
 *
 * Reads cascade state from the navigation store and returns an operations object
 * that encodes all cascade navigation rules. Tabs should prefer these operations
 * over raw `squashCascade` calls.
 *
 * @public
 */
export function useCascadeOps(): ICascadeOps {
  const cascadeStack = useNavigationStore((s) => s.cascadeStack);
  const squashCascade = useNavigationStore((s) => s.squashCascade);

  const select = useCallback(
    (entry: CascadeEntrySpec): void => {
      squashCascade([{ ...entry, mode: entry.mode ?? 'view', origin: 'primary' }]);
    },
    [squashCascade]
  );

  const drillDown = useCallback(
    (fromDepth: number, entry: CascadeEntrySpec): void => {
      const nextEntry = cascadeStack[fromDepth + 1];
      if (nextEntry?.entityType === entry.entityType && nextEntry.entityId === entry.entityId) {
        // Toggle: collapse if same entity is already at fromDepth + 1
        squashCascade(cascadeStack.slice(0, fromDepth + 1));
        return;
      }
      squashCascade([
        ...cascadeStack.slice(0, fromDepth + 1),
        { ...entry, mode: entry.mode ?? 'view', origin: 'nested' }
      ]);
    },
    [cascadeStack, squashCascade]
  );

  const editorsAbove = useCallback(
    (depth: number): ReadonlyArray<{ readonly depth: number; readonly entry: ICascadeEntry }> => {
      return findEditorsAbove(cascadeStack, depth);
    },
    [cascadeStack]
  );

  const openEditor = useCallback(
    (depth: number): ICascadeConflict | undefined => {
      const entry = cascadeStack[depth];
      if (!entry) {
        return undefined;
      }

      // Check for editors above the target depth
      const conflicts = findEditorsAbove(cascadeStack, depth);
      if (conflicts.length > 0) {
        return { conflictingEditors: conflicts };
      }

      // Trim everything above depth (downstream views become incoherent),
      // switch target to edit mode, preserving origin
      squashCascade([...cascadeStack.slice(0, depth), { ...entry, mode: 'edit' }]);
      return undefined;
    },
    [cascadeStack, squashCascade]
  );

  const openNested = useCallback(
    (fromDepth: number, entry: Omit<ICascadeEntry, 'origin'>): void => {
      squashCascade([...cascadeStack.slice(0, fromDepth + 1), { ...entry, origin: 'nested' }]);
    },
    [cascadeStack, squashCascade]
  );

  const pop = useCallback((): void => {
    if (cascadeStack.length > 0) {
      squashCascade(cascadeStack.slice(0, -1));
    }
  }, [cascadeStack, squashCascade]);

  const popToView = useCallback(
    (depth: number, refreshedEntity?: unknown): void => {
      const entry = cascadeStack[depth];
      if (!entry) {
        return;
      }
      squashCascade([
        ...cascadeStack.slice(0, depth),
        {
          ...entry,
          mode: 'view' as const,
          ...(refreshedEntity !== undefined ? { entity: refreshedEntity } : {})
        }
      ]);
    },
    [cascadeStack, squashCascade]
  );

  const hasUnsavedEditors = useCallback((): boolean => {
    return cascadeStack.some((e) => isEditOrCreate(e.mode));
  }, [cascadeStack]);

  const canSaveOrCancel = useCallback(
    (depth: number): boolean => {
      return findEditorsAbove(cascadeStack, depth).length === 0;
    },
    [cascadeStack]
  );

  const clear = useCallback((): void => {
    squashCascade([]);
  }, [squashCascade]);

  const clearIf = useCallback(
    (predicate: (entry: ICascadeEntry) => boolean): void => {
      if (cascadeStack.some(predicate)) {
        squashCascade([]);
      }
    },
    [cascadeStack, squashCascade]
  );

  const clearById = useCallback(
    (entityId: string): void => {
      clearIf((e) => e.entityId === entityId);
    },
    [clearIf]
  );

  return useMemo(
    () => ({
      select,
      drillDown,
      openEditor,
      openNested,
      pop,
      popToView,
      editorsAbove,
      hasUnsavedEditors,
      canSaveOrCancel,
      clear,
      clearById,
      clearIf,
      stack: cascadeStack
    }),
    [
      select,
      drillDown,
      openEditor,
      openNested,
      pop,
      popToView,
      editorsAbove,
      hasUnsavedEditors,
      canSaveOrCancel,
      clear,
      clearById,
      clearIf,
      cascadeStack
    ]
  );
}
