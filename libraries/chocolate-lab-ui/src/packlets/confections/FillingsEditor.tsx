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
 * Fillings editor section for confection edit view.
 *
 * Manages filling slots with preferred/alternate options, new slot creation,
 * and disambiguation between recipe vs ingredient filling types.
 *
 * @packageDocumentation
 */

import React, { useCallback, useMemo, useState } from 'react';

import { EditSection, useTypeaheadMatch } from '@fgv/ts-app-shell';
import type { Entities, FillingId, IngredientId, LibraryRuntime, SlotId } from '@fgv/ts-chocolate';

interface IRecipeFillingOptionSuggestion {
  readonly id: FillingId;
  readonly name: string;
  readonly fillingType: 'recipe';
  readonly fillingId: FillingId;
}

interface IIngredientFillingOptionSuggestion {
  readonly id: IngredientId;
  readonly name: string;
  readonly fillingType: 'ingredient';
  readonly ingredientId: IngredientId;
}

type IFillingOptionSuggestion = IRecipeFillingOptionSuggestion | IIngredientFillingOptionSuggestion;

/**
 * Props for FillingsEditor.
 * @public
 */
export interface IFillingsEditorProps {
  /** Current filling slots */
  readonly fillings: ReadonlyArray<Entities.Confections.IFillingSlotEntity> | undefined;
  /** Whether inputs are disabled */
  readonly disabled: boolean;
  /** Per-slot computed weights from default scaling */
  readonly defaultSlotWeights?: Readonly<Record<string, number>>;
  /** Confection ID for drill-down source tracking */
  readonly confectionId?: string;
  /** Available filling recipes for suggestions */
  readonly availableFillings: ReadonlyArray<LibraryRuntime.FillingRecipe>;
  /** Available ingredients for suggestions */
  readonly availableIngredients: ReadonlyArray<LibraryRuntime.AnyIngredient>;
  /** Called to commit updated fillings */
  readonly onFillingsChange: (
    fillings: ReadonlyArray<Entities.Confections.IFillingSlotEntity> | undefined
  ) => void;
  /** Called when a filling is clicked for drill-down */
  readonly onFillingClick?: (
    id: FillingId,
    targetWeight?: number,
    sourceConfectionId?: string,
    sourceSlotId?: string
  ) => void;
  /** Called when a new filling recipe should be created */
  readonly onAddFilling?: (seed: string) => void;
  /** Called when a new ingredient should be created */
  readonly onAddIngredient?: (seed: string) => void;
}

/**
 * Fillings editor section component.
 * @public
 */
export function FillingsEditor({
  fillings,
  disabled,
  defaultSlotWeights,
  confectionId,
  availableFillings,
  availableIngredients,
  onFillingsChange,
  onFillingClick,
  onAddFilling,
  onAddIngredient
}: IFillingsEditorProps): React.ReactElement {
  // ---- Pending new filling disambiguation state ----
  const [pendingNewFilling, setPendingNewFilling] = useState<{ seed: string; slotId?: string } | null>(null);

  // ---- Pending new slot state ----
  const [pendingNewSlot, setPendingNewSlot] = useState<{
    slotName: string;
    option: Entities.Confections.AnyFillingOptionEntity;
    optionId: Entities.Confections.FillingOptionId;
  } | null>(null);
  const [pendingNewSlotName, setPendingNewSlotName] = useState('');

  const fillingSuggestions = useMemo(
    () => availableFillings.map((f) => ({ id: f.id, name: f.name })),
    [availableFillings]
  );

  const fillingOptionSuggestions = useMemo(
    (): ReadonlyArray<IFillingOptionSuggestion> => [
      ...availableFillings.map(
        (f): IFillingOptionSuggestion => ({ id: f.id, name: f.name, fillingType: 'recipe', fillingId: f.id })
      ),
      ...availableIngredients.map(
        (i): IFillingOptionSuggestion => ({
          id: i.id,
          name: i.name,
          fillingType: 'ingredient',
          ingredientId: i.id
        })
      )
    ],
    [availableFillings, availableIngredients]
  );

  const fillingOptionById = useMemo(
    (): ReadonlyMap<string, IFillingOptionSuggestion> =>
      new Map(fillingOptionSuggestions.map((s) => [s.id, s])),
    [fillingOptionSuggestions]
  );

  const fillingOptionMatcher = useTypeaheadMatch(
    fillingOptionSuggestions as ReadonlyArray<{ id: string; name: string }>
  );

  const slots = fillings ?? [];

  const handleAddFilling = useCallback(
    (input: string): void => {
      const match = fillingOptionMatcher.resolveOnBlur(input);
      if (!match) {
        if (input.trim()) setPendingNewFilling({ seed: input.trim() });
        return;
      }
      if (slots.some((s) => s.filling.options.some((o) => o.id === match.id))) return;
      const typed = fillingOptionById.get(match.id);
      if (!typed) return;
      const option: Entities.Confections.AnyFillingOptionEntity =
        typed.fillingType === 'ingredient'
          ? { type: 'ingredient' as const, id: typed.ingredientId }
          : { type: 'recipe' as const, id: typed.fillingId };
      const slotNumber = slots.length + 1;
      const defaultName = `Layer ${slotNumber}`;
      setPendingNewSlot({
        slotName: defaultName,
        option,
        optionId: typed.id as Entities.Confections.FillingOptionId
      });
      setPendingNewSlotName(defaultName);
    },
    [slots, fillingOptionMatcher, fillingOptionById]
  );

  const handleCommitNewSlot = useCallback((): void => {
    if (!pendingNewSlot) return;
    const slotName = pendingNewSlotName.trim() || pendingNewSlot.slotName;
    const slotId = slotName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') as SlotId;
    const newSlot: Entities.Confections.IFillingSlotEntity = {
      slotId,
      name: slotName,
      filling: {
        options: [pendingNewSlot.option],
        preferredId: pendingNewSlot.optionId
      }
    };
    onFillingsChange([...slots, newSlot]);
    setPendingNewSlot(null);
    setPendingNewSlotName('');
  }, [slots, pendingNewSlot, pendingNewSlotName, onFillingsChange]);

  const handleAddFillingAlternate = useCallback(
    (slotId: string, input: string): void => {
      const match = fillingOptionMatcher.resolveOnBlur(input);
      if (!match) {
        if (input.trim()) setPendingNewFilling({ seed: input.trim(), slotId });
        return;
      }
      const slotIdx = slots.findIndex((s) => s.slotId === slotId);
      if (slotIdx < 0) return;
      const slot = slots[slotIdx]!;
      if (slot.filling.options.some((o) => o.id === match.id)) return;
      const typed = fillingOptionById.get(match.id);
      if (!typed) return;
      const option: Entities.Confections.AnyFillingOptionEntity =
        typed.fillingType === 'ingredient'
          ? { type: 'ingredient' as const, id: typed.ingredientId }
          : { type: 'recipe' as const, id: typed.fillingId };
      const newOptions = [...slot.filling.options, option];
      const updated = [...slots];
      updated[slotIdx] = { ...slot, filling: { ...slot.filling, options: newOptions } };
      onFillingsChange(updated);
    },
    [slots, fillingOptionMatcher, fillingOptionById, onFillingsChange]
  );

  const handleRemoveFillingOption = useCallback(
    (slotId: string, optionId: string): void => {
      const slotIdx = slots.findIndex((s) => s.slotId === slotId);
      if (slotIdx < 0) return;
      const slot = slots[slotIdx]!;
      const newOptions = slot.filling.options.filter((o) => o.id !== optionId);
      if (newOptions.length === 0) {
        const updated = slots.filter((s) => s.slotId !== slotId);
        onFillingsChange(updated.length > 0 ? updated : undefined);
      } else {
        const newPreferred =
          slot.filling.preferredId === optionId ? newOptions[0]!.id : slot.filling.preferredId;
        const updated = [...slots];
        updated[slotIdx] = { ...slot, filling: { options: newOptions, preferredId: newPreferred } };
        onFillingsChange(updated);
      }
    },
    [slots, onFillingsChange]
  );

  const handleSetPreferredFillingOption = useCallback(
    (slotId: string, optionId: string): void => {
      const slotIdx = slots.findIndex((s) => s.slotId === slotId);
      if (slotIdx < 0) return;
      const slot = slots[slotIdx]!;
      const updated = [...slots];
      updated[slotIdx] = {
        ...slot,
        filling: { ...slot.filling, preferredId: optionId as Entities.Confections.FillingOptionId }
      };
      onFillingsChange(updated);
    },
    [slots, onFillingsChange]
  );

  return (
    <EditSection title="Fillings">
      <div className="space-y-2">
        {slots.map((slot) => (
          <div key={slot.slotId} className="rounded border border-gray-200 p-2 space-y-1.5">
            <div className="text-xs text-gray-400 font-medium">
              {slot.name ?? slot.slotId}
              {defaultSlotWeights?.[slot.slotId] !== undefined && (
                <span className="ml-1 text-amber-600 font-medium">
                  ({Math.round(defaultSlotWeights[slot.slotId]!)}g)
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {slot.filling.options.map((opt) => {
                const isPreferred = opt.id === slot.filling.preferredId;
                const displayName = fillingSuggestions.find((s) => s.id === opt.id)?.name ?? opt.id;
                return (
                  <span
                    key={opt.id}
                    className={`inline-flex items-center gap-0.5 text-xs rounded px-1.5 py-0.5 ${
                      isPreferred ? 'bg-choco-primary/10 text-choco-primary' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {!disabled && (
                      <button
                        type="button"
                        title={isPreferred ? 'Preferred' : 'Set as preferred'}
                        onClick={(): void => handleSetPreferredFillingOption(slot.slotId, opt.id)}
                        className={`shrink-0 ${
                          isPreferred ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'
                        }`}
                      >
                        ★
                      </button>
                    )}
                    {disabled && isPreferred && <span className="text-amber-500 shrink-0">★</span>}
                    {onFillingClick && opt.type === 'recipe' ? (
                      <button
                        type="button"
                        onClick={(): void =>
                          onFillingClick(
                            opt.id as FillingId,
                            defaultSlotWeights?.[slot.slotId],
                            confectionId,
                            slot.slotId
                          )
                        }
                        className="hover:underline"
                      >
                        {displayName}
                      </button>
                    ) : (
                      <span>{displayName}</span>
                    )}
                    {!disabled && (
                      <button
                        type="button"
                        title="Remove option"
                        onClick={(): void => handleRemoveFillingOption(slot.slotId, opt.id)}
                        className="text-gray-300 hover:text-red-400 shrink-0 ml-0.5"
                      >
                        ✕
                      </button>
                    )}
                  </span>
                );
              })}
              {!disabled &&
                (pendingNewFilling?.slotId === slot.slotId ? (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                    <span>&quot;{pendingNewFilling.seed}&quot;:</span>
                    <button
                      type="button"
                      onClick={(): void => {
                        onAddFilling?.(pendingNewFilling.seed);
                        setPendingNewFilling(null);
                      }}
                      className="underline hover:text-choco-primary"
                    >
                      recipe
                    </button>
                    <span className="text-amber-400">|</span>
                    <button
                      type="button"
                      onClick={(): void => {
                        onAddIngredient?.(pendingNewFilling.seed);
                        setPendingNewFilling(null);
                      }}
                      className="underline hover:text-choco-primary"
                    >
                      ingredient
                    </button>
                    <button
                      type="button"
                      onClick={(): void => setPendingNewFilling(null)}
                      className="ml-0.5 text-amber-400 hover:text-amber-600"
                    >
                      ✕
                    </button>
                  </span>
                ) : (
                  <input
                    type="text"
                    placeholder="+ alternate"
                    className="text-xs border border-dashed border-gray-200 rounded px-1.5 py-0.5 w-28 focus:outline-none focus:ring-1 focus:ring-choco-primary"
                    list="filling-option-suggestions"
                    onBlur={(e): void => {
                      handleAddFillingAlternate(slot.slotId, e.target.value);
                      e.target.value = '';
                    }}
                    onKeyDown={(e): void => {
                      if (e.key === 'Enter') {
                        handleAddFillingAlternate(slot.slotId, (e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
      {!disabled &&
        (pendingNewFilling && !pendingNewFilling.slotId ? (
          <div className="mt-2 rounded border border-amber-200 bg-amber-50 p-2 space-y-1.5">
            <div className="text-xs text-amber-800">
              <span className="font-medium">&quot;{pendingNewFilling.seed}&quot;</span> not found. Create as:
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={(): void => {
                  onAddFilling?.(pendingNewFilling.seed);
                  setPendingNewFilling(null);
                }}
                className="px-2 py-0.5 text-xs rounded bg-choco-primary text-white hover:bg-choco-primary/90"
              >
                Filling Recipe
              </button>
              <button
                type="button"
                onClick={(): void => {
                  onAddIngredient?.(pendingNewFilling.seed);
                  setPendingNewFilling(null);
                }}
                className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Ingredient
              </button>
              <button
                type="button"
                onClick={(): void => setPendingNewFilling(null)}
                className="px-2 py-0.5 text-xs text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : pendingNewSlot ? (
          <div className="mt-2 rounded border border-choco-primary/30 bg-choco-primary/5 p-2 space-y-1.5">
            <div className="text-xs text-gray-500">Slot name:</div>
            <input
              type="text"
              value={pendingNewSlotName}
              onChange={(e): void => setPendingNewSlotName(e.target.value)}
              onKeyDown={(e): void => {
                if (e.key === 'Enter') handleCommitNewSlot();
                if (e.key === 'Escape') {
                  setPendingNewSlot(null);
                  setPendingNewSlotName('');
                }
              }}
              className="text-xs border border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-choco-primary"
              autoFocus
            />
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={handleCommitNewSlot}
                className="px-2 py-0.5 text-xs rounded bg-choco-primary text-white hover:bg-choco-primary/90"
              >
                Add
              </button>
              <button
                type="button"
                onClick={(): void => {
                  setPendingNewSlot(null);
                  setPendingNewSlotName('');
                }}
                className="px-2 py-0.5 text-xs text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <input
            type="text"
            placeholder="Add filling slot…"
            className="mt-2 text-xs border border-dashed border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-choco-primary"
            list="filling-option-suggestions"
            onBlur={(e): void => {
              handleAddFilling(e.target.value);
              e.target.value = '';
            }}
            onKeyDown={(e): void => {
              if (e.key === 'Enter') {
                handleAddFilling((e.target as HTMLInputElement).value);
                (e.target as HTMLInputElement).value = '';
              }
            }}
          />
        ))}
      <datalist id="filling-option-suggestions">
        {fillingOptionSuggestions.map((s) => (
          <option key={s.id} value={s.name} />
        ))}
      </datalist>
    </EditSection>
  );
}
