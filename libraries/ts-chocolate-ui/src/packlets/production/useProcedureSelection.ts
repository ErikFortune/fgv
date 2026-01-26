/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import { useCallback, useMemo } from 'react';
import type { IProcedureState, IProcedureActions, IProcedureOption } from './model';

/**
 * Procedure spec from version data
 * @public
 */
export interface IProcedureSpec {
  /** Available procedure options */
  options: readonly IProcedureOption[];
  /** Preferred procedure ID */
  preferredId?: string;
}

/**
 * Options for useProcedureSelection hook
 * @public
 */
export interface IUseProcedureSelectionOptions {
  /** Base procedure spec from the version */
  baseSpec: IProcedureSpec | undefined;
  /** Draft procedure spec (with edits applied) */
  draftSpec: IProcedureSpec | undefined;
  /** Callback when draft changes (for recipe modifications like addOption, removeOption) */
  onUpdateDraft: (spec: IProcedureSpec) => void;
  /** Callback to reset draft */
  onResetDraft: () => void;
  /**
   * Production-selected procedure ID (for this run, not recipe edit).
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
 * Result type for useProcedureSelection hook
 * @public
 */
export interface IUseProcedureSelectionResult {
  /** Current procedure state */
  state: IProcedureState;
  /** Actions for modifying procedure selection */
  actions: IProcedureActions;
}

/**
 * Hook for managing procedure selection.
 *
 * Supports selecting from available procedures, adding new options,
 * and removing options from the list.
 *
 * @example
 * ```tsx
 * const { state, actions } = useProcedureSelection({
 *   baseSpec: { options: [{ id: 'proc-001' }], preferredId: 'proc-001' },
 *   draftSpec: draftVersion?.procedures,
 *   onUpdateDraft: (spec) => updateDraft({ procedures: spec }),
 *   onResetDraft: () => updateDraft({ draftVersion: undefined })
 * });
 *
 * // Select a procedure
 * actions.select('proc-002');
 *
 * // Add a new procedure option
 * actions.addOption({ id: 'proc-003', notes: 'Alternative method' });
 * ```
 *
 * @param options - Hook configuration
 * @returns Object containing state and actions
 * @public
 */
export function useProcedureSelection(options: IUseProcedureSelectionOptions): IUseProcedureSelectionResult {
  const { baseSpec, draftSpec, onUpdateDraft, onResetDraft, productionSelectedId, onSelectProduction } =
    options;

  const state = useMemo((): IProcedureState => {
    const effectiveSpec = draftSpec ?? baseSpec;
    const procedureOptions = effectiveSpec?.options ?? [];
    const basePreferredId = baseSpec?.preferredId ?? baseSpec?.options?.[0]?.id;

    // For display, use: production selection > draft preferredId > base preferredId
    const specPreferredId = effectiveSpec?.preferredId ?? effectiveSpec?.options?.[0]?.id;
    const effectivePreferredId = productionSelectedId ?? specPreferredId;

    // hasChanges only tracks RECIPE changes (options added/removed), not production selection
    // Comparing option IDs to detect if options have changed
    const baseOptionIds = [...(baseSpec?.options ?? [])].map((o) => o.id).sort();
    const currentOptionIds = [...procedureOptions].map((o) => o.id).sort();
    const hasChanges =
      draftSpec !== undefined && JSON.stringify(currentOptionIds) !== JSON.stringify(baseOptionIds);

    return {
      options: procedureOptions,
      basePreferredId,
      effectivePreferredId,
      hasChanges
    };
  }, [baseSpec, draftSpec, productionSelectedId]);

  const select = useCallback(
    (id: string): void => {
      const effectiveSpec = draftSpec ?? baseSpec;
      if (!effectiveSpec) return;

      // Verify the ID is in available options
      if (!effectiveSpec.options.some((opt) => opt.id === id)) return;

      // Use production selection callback if provided (doesn't modify draft)
      if (onSelectProduction) {
        onSelectProduction(id);
        return;
      }

      // Fallback: modify draft (legacy behavior)
      onUpdateDraft({
        options: [...effectiveSpec.options],
        preferredId: id
      });
    },
    [baseSpec, draftSpec, onSelectProduction, onUpdateDraft]
  );

  const addOption = useCallback(
    (option: IProcedureOption): void => {
      const effectiveSpec = draftSpec ?? baseSpec;

      // If no spec exists yet, create one with just this option
      if (!effectiveSpec) {
        onUpdateDraft({
          options: [option],
          preferredId: option.id
        });
        return;
      }

      // Don't add duplicates
      if (effectiveSpec.options.some((opt) => opt.id === option.id)) return;

      onUpdateDraft({
        options: [...effectiveSpec.options, option],
        preferredId: option.id // Select the newly added procedure
      });
    },
    [baseSpec, draftSpec, onUpdateDraft]
  );

  const removeOption = useCallback(
    (id: string): void => {
      const effectiveSpec = draftSpec ?? baseSpec;
      if (!effectiveSpec) return;

      // Don't remove the last option
      if (effectiveSpec.options.length <= 1) return;

      const newOptions = effectiveSpec.options.filter((opt) => opt.id !== id);
      const preferredId = effectiveSpec.preferredId === id ? newOptions[0]?.id : effectiveSpec.preferredId;

      onUpdateDraft({
        options: newOptions,
        preferredId
      });
    },
    [baseSpec, draftSpec, onUpdateDraft]
  );

  const reset = useCallback((): void => {
    onResetDraft();
  }, [onResetDraft]);

  const actions = useMemo(
    (): IProcedureActions => ({
      select,
      addOption,
      removeOption,
      reset
    }),
    [select, addOption, removeOption, reset]
  );

  return { state, actions };
}
