/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import { useCallback, useMemo } from 'react';
import type { IShellChocolateState, IShellChocolateActions } from './model';

/**
 * Shell chocolate spec from version data
 * @public
 */
export interface IShellChocolateSpec {
  /** Available chocolate IDs */
  ids: readonly string[];
  /** Preferred chocolate ID */
  preferredId?: string;
}

/**
 * Options for useShellChocolateSelection hook
 * @public
 */
export interface IUseShellChocolateSelectionOptions {
  /** Base shell chocolate spec from the version */
  baseSpec: IShellChocolateSpec | undefined;
  /** Draft shell chocolate spec (with edits applied) */
  draftSpec: IShellChocolateSpec | undefined;
  /** Callback when draft changes (for recipe modifications like addChoice, removeChoice) */
  onUpdateDraft: (spec: IShellChocolateSpec) => void;
  /** Callback to reset draft (clear draft version) */
  onResetDraft: () => void;
  /**
   * Production-selected chocolate ID (for this run, not recipe edit).
   * If provided, this overrides preferredId for display but doesn't modify the draft.
   */
  productionSelectedId?: string;
  /**
   * Callback when selecting from existing options (production selection, not recipe edit).
   * If provided, select() calls this instead of onUpdateDraft.
   */
  onSelectProduction?: (id: string) => void;
}

/**
 * Result type for useShellChocolateSelection hook
 * @public
 */
export interface IUseShellChocolateSelectionResult {
  /** Current shell chocolate state */
  state: IShellChocolateState;
  /** Actions for modifying shell chocolate selection */
  actions: IShellChocolateActions;
}

/**
 * Hook for managing shell chocolate selection.
 *
 * Supports selecting from available chocolates, adding new options,
 * and removing options from the list.
 *
 * @example
 * ```tsx
 * const { state, actions } = useShellChocolateSelection({
 *   baseSpec: { ids: ['choco-001', 'choco-002'], preferredId: 'choco-001' },
 *   draftSpec: draftVersion?.shellChocolate,
 *   onUpdateDraft: (spec) => updateDraft({ shellChocolate: spec }),
 *   onResetDraft: () => updateDraft({ draftVersion: undefined })
 * });
 *
 * // Select a chocolate
 * actions.select('choco-002');
 *
 * // Add a new chocolate option
 * actions.addChoice('choco-003');
 * ```
 *
 * @param options - Hook configuration
 * @returns Object containing state and actions
 * @public
 */
export function useShellChocolateSelection(
  options: IUseShellChocolateSelectionOptions
): IUseShellChocolateSelectionResult {
  const { baseSpec, draftSpec, onUpdateDraft, onResetDraft, productionSelectedId, onSelectProduction } =
    options;

  const state = useMemo((): IShellChocolateState => {
    const effectiveSpec = draftSpec ?? baseSpec;
    const availableChoices = effectiveSpec?.ids ?? [];
    const basePreferredId = baseSpec?.preferredId ?? baseSpec?.ids?.[0];

    // For display, use: production selection > draft preferredId > base preferredId
    const specPreferredId = effectiveSpec?.preferredId ?? effectiveSpec?.ids?.[0];
    const effectivePreferredId = productionSelectedId ?? specPreferredId;

    // hasChanges only tracks RECIPE changes (options added/removed), not production selection
    // Comparing sorted IDs to detect if options have changed
    const baseIds = [...(baseSpec?.ids ?? [])].sort();
    const currentIds = [...availableChoices].sort();
    const hasChanges = draftSpec !== undefined && JSON.stringify(currentIds) !== JSON.stringify(baseIds);

    return {
      availableChoices,
      basePreferredId,
      effectivePreferredId,
      hasChanges
    };
  }, [baseSpec, draftSpec, productionSelectedId]);

  const select = useCallback(
    (id: string): void => {
      const effectiveSpec = draftSpec ?? baseSpec;
      if (!effectiveSpec) return;

      // Verify the ID is in available choices
      if (!effectiveSpec.ids.includes(id)) return;

      // Use production selection callback if provided (doesn't modify draft)
      if (onSelectProduction) {
        onSelectProduction(id);
        return;
      }

      // Fallback: modify draft (legacy behavior)
      onUpdateDraft({
        ids: [...effectiveSpec.ids],
        preferredId: id
      });
    },
    [baseSpec, draftSpec, onSelectProduction, onUpdateDraft]
  );

  const addChoice = useCallback(
    (id: string): void => {
      const effectiveSpec = draftSpec ?? baseSpec;

      // If no spec exists yet, create one with just this choice
      if (!effectiveSpec) {
        onUpdateDraft({
          ids: [id],
          preferredId: id
        });
        return;
      }

      // Don't add duplicates
      if (effectiveSpec.ids.includes(id)) return;

      onUpdateDraft({
        ids: [...effectiveSpec.ids, id],
        preferredId: id // Select the newly added chocolate
      });
    },
    [baseSpec, draftSpec, onUpdateDraft]
  );

  const removeChoice = useCallback(
    (id: string): void => {
      const effectiveSpec = draftSpec ?? baseSpec;
      if (!effectiveSpec) return;

      // Don't remove the last option
      if (effectiveSpec.ids.length <= 1) return;

      const newIds = effectiveSpec.ids.filter((existingId) => existingId !== id);
      const preferredId = effectiveSpec.preferredId === id ? newIds[0] : effectiveSpec.preferredId;

      onUpdateDraft({
        ids: newIds,
        preferredId
      });
    },
    [baseSpec, draftSpec, onUpdateDraft]
  );

  const reset = useCallback((): void => {
    onResetDraft();
  }, [onResetDraft]);

  const actions = useMemo(
    (): IShellChocolateActions => ({
      select,
      addChoice,
      removeChoice,
      reset
    }),
    [select, addChoice, removeChoice, reset]
  );

  return { state, actions };
}
