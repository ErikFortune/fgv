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
 * Generic editing context hook for entity editors with undo/redo support.
 *
 * Works with any wrapper that implements the {@link IEditable} interface
 * (e.g., EditedIngredient, EditedMold).
 *
 * Uses a version counter to trigger React re-renders after mutations,
 * since the underlying wrappers are mutable objects.
 *
 * @packageDocumentation
 */

import { useCallback, useRef, useState } from 'react';

import type { Result } from '@fgv/ts-utils';

// ============================================================================
// IEditable Interface
// ============================================================================

/**
 * Common interface for entity wrappers that support undo/redo.
 * Both EditedIngredient and EditedMold implement this shape.
 * @public
 */
export interface IEditable {
  /** Undo the last change. Returns Success(true) if undone, Success(false) if nothing to undo. */
  undo(): Result<boolean>;
  /** Redo the last undone change. Returns Success(true) if redone, Success(false) if nothing to redo. */
  redo(): Result<boolean>;
  /** Whether undo is available. */
  canUndo(): boolean;
  /** Whether redo is available. */
  canRedo(): boolean;
}

// ============================================================================
// Editing Context Types
// ============================================================================

/**
 * Options for creating an editing context.
 * @public
 */
export interface IEditingContextOptions<TWrapper extends IEditable> {
  /** The mutable wrapper instance to manage. */
  readonly wrapper: TWrapper;
  /** Callback invoked when the user requests save. Receives the wrapper for snapshot extraction. */
  readonly onSave: (wrapper: TWrapper) => void;
  /** Callback invoked when the user requests "save to" another collection. */
  readonly onSaveAs?: (wrapper: TWrapper) => void;
  /** Callback invoked when the user cancels editing. */
  readonly onCancel: () => void;
  /** Optional callback invoked after every mutation (undo, redo, or field edit). */
  readonly onMutation?: () => void;
  /** If true, the source entity is read-only (e.g. built-in collection). Save is replaced by Save to. */
  readonly readOnly?: boolean;
}

/**
 * The editing context returned by {@link useEditingContext}.
 * Provides the wrapper, undo/redo state, and action callbacks.
 * @public
 */
export interface IEditingContext<TWrapper extends IEditable> {
  /** The mutable wrapper instance. Callers mutate it then call `notifyMutation`. */
  readonly wrapper: TWrapper;
  /** Whether undo is available. */
  readonly canUndo: boolean;
  /** Whether redo is available. */
  readonly canRedo: boolean;
  /** Monotonic version counter — incremented on every mutation. */
  readonly version: number;
  /** If true, the source entity is read-only. Save is replaced by Save to. */
  readonly readOnly: boolean;
  /** Call after mutating the wrapper to trigger a React re-render. */
  readonly notifyMutation: () => void;
  /** Undo the last change and re-render. */
  readonly undo: () => void;
  /** Redo the last undone change and re-render. */
  readonly redo: () => void;
  /** Request save (delegates to the onSave callback). */
  readonly save: () => void;
  /** Request "save to" another collection (delegates to onSaveAs). Undefined if not available. */
  readonly saveAs?: () => void;
  /** Request cancel (delegates to the onCancel callback). */
  readonly cancel: () => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * React hook that wraps a mutable editing wrapper (EditedIngredient, EditedMold, etc.)
 * and provides undo/redo state plus action callbacks.
 *
 * The wrapper is a mutable object — callers mutate it via its methods, then call
 * `notifyMutation()` to bump the version counter and trigger a React re-render.
 *
 * Undo/redo actions automatically call `notifyMutation()`.
 *
 * @param options - Editing context configuration
 * @returns The editing context with wrapper, state, and actions
 * @public
 */
export function useEditingContext<TWrapper extends IEditable>(
  options: IEditingContextOptions<TWrapper>
): IEditingContext<TWrapper> {
  const { wrapper, onSave, onSaveAs, onCancel, onMutation, readOnly: isReadOnly } = options;

  // Stable ref for the wrapper — it never changes identity during a session.
  const wrapperRef = useRef(wrapper);
  wrapperRef.current = wrapper;

  // Version counter drives re-renders after mutations.
  const [version, setVersion] = useState(0);

  const notifyMutation = useCallback((): void => {
    setVersion((v) => v + 1);
    onMutation?.();
  }, [onMutation]);

  const undo = useCallback((): void => {
    wrapperRef.current.undo();
    notifyMutation();
  }, [notifyMutation]);

  const redo = useCallback((): void => {
    wrapperRef.current.redo();
    notifyMutation();
  }, [notifyMutation]);

  const save = useCallback((): void => {
    onSave(wrapperRef.current);
  }, [onSave]);

  const saveAsCallback = useCallback((): void => {
    onSaveAs?.(wrapperRef.current);
  }, [onSaveAs]);

  const cancel = useCallback((): void => {
    onCancel();
  }, [onCancel]);

  return {
    wrapper,
    canUndo: wrapper.canUndo(),
    canRedo: wrapper.canRedo(),
    version,
    readOnly: isReadOnly ?? false,
    notifyMutation,
    undo,
    redo,
    save,
    saveAs: onSaveAs ? saveAsCallback : undefined,
    cancel
  };
}
