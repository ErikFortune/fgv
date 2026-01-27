/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import { useCallback, useMemo } from 'react';
import type { IFillingSlotState, IFillingSlotActions, IFillingOption, SlotId } from './model';

/**
 * Raw filling slot data from version
 * @public
 */
export interface IFillingSlotData {
  /** Slot identifier */
  slotId: string;
  /** Slot name */
  name?: string;
  /** Filling options */
  filling: {
    options: readonly IFillingOption[];
    preferredId?: string;
  };
}

/**
 * Options for useFillingSlotManagement hook
 * @public
 */
export interface IUseFillingSlotManagementOptions {
  /** Base filling slots from the version */
  baseSlots: readonly IFillingSlotData[] | undefined;
  /** Draft filling slots (with edits applied) */
  draftSlots: readonly IFillingSlotData[] | undefined;
  /** Callback when draft changes (for recipe modifications like addFillingOption, removeFillingOption) */
  onUpdateDraft: (slots: IFillingSlotData[]) => void;
  /** Callback to reset draft */
  onResetDraft: () => void;
  /** Function to generate a new slot ID */
  generateSlotId?: () => string;
  /**
   * Production-selected fillings per slot (for this run, not recipe edit).
   * If provided, this overrides preferredId for display but doesn't modify the draft.
   */
  productionSelections?: Readonly<Record<SlotId, string>>;
  /**
   * Callback when selecting from existing options (production selection, not recipe edit).
   * If provided, selectFilling() calls this instead of onUpdateDraft.
   */
  onSelectProduction?: (slotId: SlotId, fillingId: string) => void;
}

/**
 * Result type for useFillingSlotManagement hook
 * @public
 */
export interface IUseFillingSlotManagementResult {
  /** Current filling slot states */
  slots: readonly IFillingSlotState[];
  /** Actions for modifying filling slots */
  actions: IFillingSlotActions;
  /** Whether any slot has changes from base */
  hasChanges: boolean;
}

/**
 * Default slot ID generator
 */
function defaultGenerateSlotId(): string {
  return `slot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Hook for managing filling slots.
 *
 * Supports full CRUD operations on filling slots including adding/removing
 * slots, renaming slots, and managing filling options within each slot.
 *
 * @example
 * ```tsx
 * const { slots, actions, hasChanges } = useFillingSlotManagement({
 *   baseSlots: baseVersion?.fillings,
 *   draftSlots: draftVersion?.fillings,
 *   onUpdateDraft: (slots) => updateDraft({ fillings: slots }),
 *   onResetDraft: () => updateDraft({ draftVersion: undefined })
 * });
 *
 * // Add a new slot
 * const newSlotId = actions.addSlot('Ganache Layer');
 *
 * // Select a filling for a slot
 * actions.selectFilling(slotId, 'filling-001');
 *
 * // Add a filling option to a slot
 * actions.addFillingOption(slotId, { type: 'recipe', id: 'filling-002' });
 * ```
 *
 * @param options - Hook configuration
 * @returns Object containing slots state and actions
 * @public
 */
export function useFillingSlotManagement(
  options: IUseFillingSlotManagementOptions
): IUseFillingSlotManagementResult {
  const {
    baseSlots,
    draftSlots,
    onUpdateDraft,
    onResetDraft,
    generateSlotId = defaultGenerateSlotId,
    productionSelections,
    onSelectProduction
  } = options;

  const slots = useMemo((): readonly IFillingSlotState[] => {
    const effectiveSlots = draftSlots ?? baseSlots ?? [];

    return effectiveSlots.map((slot): IFillingSlotState => {
      const baseSlot = baseSlots?.find((b) => b.slotId === slot.slotId);
      /* c8 ignore next 2 - defensive: fallbacks for empty options array */
      const basePreferredId = baseSlot?.filling.preferredId ?? baseSlot?.filling.options[0]?.id;
      const specPreferredId = slot.filling.preferredId ?? slot.filling.options[0]?.id;

      // For display, use: production selection > draft preferredId > base preferredId
      const productionSelectedId = productionSelections?.[slot.slotId as SlotId];
      const preferredId = productionSelectedId ?? specPreferredId;

      // hasChanges only tracks RECIPE changes (options added/removed, slots added/removed, renamed), not production selection
      const baseOptionIds = [...(baseSlot?.filling.options ?? [])].map((o) => o.id).sort();
      const currentOptionIds = [...slot.filling.options].map((o) => o.id).sort();
      const optionsChanged =
        draftSlots !== undefined &&
        baseSlot !== undefined &&
        JSON.stringify(currentOptionIds) !== JSON.stringify(baseOptionIds);
      const nameChanged = draftSlots !== undefined && baseSlot !== undefined && slot.name !== baseSlot.name;
      const isNewSlot = draftSlots !== undefined && !baseSlot;

      return {
        slotId: slot.slotId as SlotId,
        name: slot.name ?? slot.slotId,
        options: slot.filling.options,
        preferredId,
        basePreferredId,
        hasChanges: optionsChanged || nameChanged || isNewSlot
      };
    });
  }, [baseSlots, draftSlots, productionSelections]);

  const hasChanges = useMemo((): boolean => {
    if (draftSlots === undefined) return false;

    /* c8 ignore next - defensive: nullish coalescing for undefined baseSlots */
    if ((baseSlots?.length ?? 0) !== draftSlots.length) return true;

    // Check for any slot-level changes
    return slots.some((slot) => slot.hasChanges);
  }, [baseSlots, draftSlots, slots]);

  const getEffectiveSlots = useCallback((): IFillingSlotData[] => {
    /* c8 ignore next - defensive: fallback for undefined slots */
    const effective = draftSlots ?? baseSlots ?? [];
    return effective.map((slot) => ({
      slotId: slot.slotId,
      name: slot.name,
      filling: {
        options: [...slot.filling.options],
        preferredId: slot.filling.preferredId
      }
    }));
  }, [baseSlots, draftSlots]);

  const addSlot = useCallback(
    (name: string): SlotId => {
      const newSlotId = generateSlotId() as SlotId;
      const effectiveSlots = getEffectiveSlots();

      effectiveSlots.push({
        slotId: newSlotId,
        name: name.trim() || 'New Filling',
        filling: {
          options: [],
          preferredId: undefined
        }
      });

      onUpdateDraft(effectiveSlots);
      return newSlotId;
    },
    [generateSlotId, getEffectiveSlots, onUpdateDraft]
  );

  const removeSlot = useCallback(
    (slotId: SlotId): void => {
      const effectiveSlots = getEffectiveSlots();
      const filtered = effectiveSlots.filter((slot) => slot.slotId !== slotId);

      if (filtered.length === effectiveSlots.length) return; // Slot not found

      onUpdateDraft(filtered);
    },
    [getEffectiveSlots, onUpdateDraft]
  );

  const renameSlot = useCallback(
    (slotId: SlotId, name: string): void => {
      const effectiveSlots = getEffectiveSlots();
      const slotIndex = effectiveSlots.findIndex((slot) => slot.slotId === slotId);

      /* c8 ignore next - defensive: slot not found */
      if (slotIndex < 0) return;

      effectiveSlots[slotIndex] = {
        ...effectiveSlots[slotIndex],
        name: name.trim() || undefined
      };

      onUpdateDraft(effectiveSlots);
    },
    [getEffectiveSlots, onUpdateDraft]
  );

  const selectFilling = useCallback(
    (slotId: SlotId, fillingId: string): void => {
      const effectiveSlots = getEffectiveSlots();
      const slotIndex = effectiveSlots.findIndex((slot) => slot.slotId === slotId);

      /* c8 ignore next - defensive: slot not found */
      if (slotIndex < 0) return;

      const slot = effectiveSlots[slotIndex];

      // Verify the filling is in the options
      if (!slot.filling.options.some((opt) => opt.id === fillingId)) return;

      // Use production selection callback if provided (doesn't modify draft)
      if (onSelectProduction) {
        onSelectProduction(slotId, fillingId);
        return;
      }

      // Fallback: modify draft (legacy behavior)
      effectiveSlots[slotIndex] = {
        ...slot,
        filling: {
          ...slot.filling,
          preferredId: fillingId
        }
      };

      onUpdateDraft(effectiveSlots);
    },
    [getEffectiveSlots, onSelectProduction, onUpdateDraft]
  );

  const addFillingOption = useCallback(
    (slotId: SlotId, option: IFillingOption): void => {
      const effectiveSlots = getEffectiveSlots();
      const slotIndex = effectiveSlots.findIndex((slot) => slot.slotId === slotId);

      /* c8 ignore next - defensive: slot not found */
      if (slotIndex < 0) return;

      const slot = effectiveSlots[slotIndex];

      // Don't add duplicates
      if (slot.filling.options.some((opt) => opt.id === option.id)) return;

      const newOptions = [...slot.filling.options, option];

      effectiveSlots[slotIndex] = {
        ...slot,
        filling: {
          options: newOptions,
          preferredId: option.id // Select the newly added option
        }
      };

      onUpdateDraft(effectiveSlots);
    },
    [getEffectiveSlots, onUpdateDraft]
  );

  const removeFillingOption = useCallback(
    (slotId: SlotId, fillingId: string): void => {
      const effectiveSlots = getEffectiveSlots();
      const slotIndex = effectiveSlots.findIndex((slot) => slot.slotId === slotId);

      /* c8 ignore next - defensive: slot not found */
      if (slotIndex < 0) return;

      const slot = effectiveSlots[slotIndex];

      // Don't remove the last option
      if (slot.filling.options.length <= 1) return;

      const newOptions = slot.filling.options.filter((opt) => opt.id !== fillingId);
      /* c8 ignore next 2 - defensive: newOptions[0] always exists due to length > 1 check above */
      const preferredId =
        slot.filling.preferredId === fillingId ? newOptions[0]?.id : slot.filling.preferredId;

      effectiveSlots[slotIndex] = {
        ...slot,
        filling: {
          options: newOptions,
          preferredId
        }
      };

      onUpdateDraft(effectiveSlots);
    },
    [getEffectiveSlots, onUpdateDraft]
  );

  const reset = useCallback((): void => {
    onResetDraft();
  }, [onResetDraft]);

  const actions = useMemo(
    (): IFillingSlotActions => ({
      addSlot,
      removeSlot,
      renameSlot,
      selectFilling,
      addFillingOption,
      removeFillingOption,
      reset
    }),
    [addSlot, removeSlot, renameSlot, selectFilling, addFillingOption, removeFillingOption, reset]
  );

  return { slots, actions, hasChanges };
}
