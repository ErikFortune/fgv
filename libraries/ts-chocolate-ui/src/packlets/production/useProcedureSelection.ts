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
  /** Callback when draft changes */
  onUpdateDraft: (spec: IProcedureSpec) => void;
  /** Callback to reset draft */
  onResetDraft: () => void;
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
  const { baseSpec, draftSpec, onUpdateDraft, onResetDraft } = options;

  const state = useMemo((): IProcedureState => {
    const effectiveSpec = draftSpec ?? baseSpec;
    const procedureOptions = effectiveSpec?.options ?? [];
    const basePreferredId = baseSpec?.preferredId ?? baseSpec?.options[0]?.id;
    const effectivePreferredId = effectiveSpec?.preferredId ?? effectiveSpec?.options[0]?.id;

    const hasChanges =
      draftSpec !== undefined &&
      (effectivePreferredId !== basePreferredId ||
        JSON.stringify(procedureOptions) !== JSON.stringify(baseSpec?.options ?? []));

    return {
      options: procedureOptions,
      basePreferredId,
      effectivePreferredId,
      hasChanges
    };
  }, [baseSpec, draftSpec]);

  const select = useCallback(
    (id: string): void => {
      const effectiveSpec = draftSpec ?? baseSpec;
      if (!effectiveSpec) return;

      // Verify the ID is in available options
      if (!effectiveSpec.options.some((opt) => opt.id === id)) return;

      onUpdateDraft({
        options: [...effectiveSpec.options],
        preferredId: id
      });
    },
    [baseSpec, draftSpec, onUpdateDraft]
  );

  const addOption = useCallback(
    (option: IProcedureOption): void => {
      const effectiveSpec = draftSpec ?? baseSpec;
      if (!effectiveSpec) return;

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
