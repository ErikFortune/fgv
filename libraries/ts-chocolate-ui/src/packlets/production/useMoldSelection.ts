/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import { useCallback, useMemo } from 'react';
import type { IMoldOption, IMoldState, IMoldActions } from './model';

/**
 * Mold spec from version data
 * @public
 */
export interface IMoldSpec {
  /** Available mold options */
  options: readonly IMoldOption[];
  /** Preferred mold ID */
  preferredId?: string;
}

/**
 * Options for useMoldSelection hook
 * @public
 */
export interface IUseMoldSelectionOptions {
  /** Base mold spec from the version */
  baseSpec: IMoldSpec | undefined;
  /** Draft mold spec (with edits applied) */
  draftSpec: IMoldSpec | undefined;
  /** Callback when draft changes (for recipe modifications like addOption, removeOption) */
  onUpdateDraft: (spec: IMoldSpec) => void;
  /** Callback to reset draft (clear draft version) */
  onResetDraft: () => void;
  /**
   * Production-selected mold ID (for this run, not recipe edit).
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
 * Result type for useMoldSelection hook
 * @public
 */
export interface IUseMoldSelectionResult {
  /** Current mold state */
  state: IMoldState;
  /** Actions for modifying mold selection */
  actions: IMoldActions;
}

/**
 * Hook for managing mold selection.
 *
 * Supports selecting from available molds, adding new options,
 * and removing options from the list.
 *
 * @example
 * ```tsx
 * const { state, actions } = useMoldSelection({
 *   baseSpec: { options: [{ id: 'mold-001' }], preferredId: 'mold-001' },
 *   draftSpec: draftVersion?.molds,
 *   onUpdateDraft: (spec) => updateDraft({ molds: spec }),
 *   onResetDraft: () => updateDraft({ draftVersion: undefined })
 * });
 *
 * // Select a mold
 * actions.select('mold-002');
 *
 * // Add a new mold option
 * actions.addOption({ id: 'mold-003' });
 * ```
 *
 * @param options - Hook configuration
 * @returns Object containing state and actions
 * @public
 */
export function useMoldSelection(options: IUseMoldSelectionOptions): IUseMoldSelectionResult {
  const { baseSpec, draftSpec, onUpdateDraft, onResetDraft, productionSelectedId, onSelectProduction } =
    options;

  const state = useMemo((): IMoldState => {
    const effectiveSpec = draftSpec ?? baseSpec;
    const opts = effectiveSpec?.options ?? [];
    const basePreferredId = baseSpec?.preferredId ?? baseSpec?.options?.[0]?.id;

    // For display, use: production selection > draft preferredId > base preferredId
    const specPreferredId = effectiveSpec?.preferredId ?? effectiveSpec?.options?.[0]?.id;
    const effectivePreferredId = productionSelectedId ?? specPreferredId;

    // hasChanges only tracks RECIPE changes (options added/removed), not production selection
    // Comparing option IDs to detect if options have changed
    const baseOptionIds = [...(baseSpec?.options ?? [])].map((o) => o.id).sort();
    const currentOptionIds = [...opts].map((o) => o.id).sort();
    const hasChanges =
      draftSpec !== undefined && JSON.stringify(currentOptionIds) !== JSON.stringify(baseOptionIds);

    return {
      options: opts,
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
    (option: IMoldOption): void => {
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
      if (effectiveSpec.options.some((o) => o.id === option.id)) return;

      onUpdateDraft({
        options: [...effectiveSpec.options, option],
        preferredId: option.id // Select the newly added mold
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
    (): IMoldActions => ({
      select,
      addOption,
      removeOption,
      reset
    }),
    [select, addOption, removeOption, reset]
  );

  return { state, actions };
}
