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
 * Confection recipe edit view — variation curation.
 * Manages recipe-level editing (name, description, tags, urls, golden variation, variation list)
 * via EditedConfectionRecipe. Variation-level editing (fillings, procedures, scaling) is
 * handled by ConfectionEditingSession and is not part of this view.
 * @packageDocumentation
 */

import React, { useCallback, useMemo, useState } from 'react';
import { TagIcon, DocumentTextIcon, HashtagIcon, LinkIcon } from '@heroicons/react/20/solid';
import { CheckIcon } from '@heroicons/react/24/solid';
import { DocumentDuplicateIcon, PlusIcon } from '@heroicons/react/24/outline';

import {
  EditField,
  EditSection,
  TextInput,
  TagsInput,
  MultiActionButton,
  useTypeaheadMatch
} from '@fgv/ts-app-shell';
import type {
  ConfectionName,
  ConfectionRecipeVariationSpec,
  DecorationId,
  Entities,
  FillingId,
  IngredientId,
  LibraryRuntime,
  MoldId,
  Model,
  ProcedureId,
  SlotId
} from '@fgv/ts-chocolate';
import { Entities as EntitiesNS } from '@fgv/ts-chocolate';

import { EditingToolbar, NotesEditor, useEditingContext, type IChangeIndicator } from '../editing';
import { DerivedFromIndicator } from '../common';
import { useWorkspace } from '../workspace';

type EditedConfectionRecipe = LibraryRuntime.EditedConfectionRecipe;

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

// ============================================================================
// Props
// ============================================================================

/**
 * Save mode for confection recipe editing.
 * - `update`: overwrite the current variation in place
 * - `new-variation`: save edits as a new variation on the same recipe
 * - `new-recipe`: create an entirely new recipe derived from this one
 * @public
 */
export type ConfectionSaveMode = 'update' | 'new-variation' | 'new-recipe';

/**
 * Props for the ConfectionEditView component.
 * @public
 */
export interface IConfectionEditViewProps {
  /** Recipe-level wrapper with undo/redo */
  readonly wrapper: EditedConfectionRecipe;
  /** The resolved confection runtime object (for ConfectionDetail display) */
  readonly confection: LibraryRuntime.IConfectionBase;
  /** Currently selected variation spec */
  readonly selectedVariationSpec: ConfectionRecipeVariationSpec;
  /** Callback when user selects a different variation */
  readonly onVariationChange: (spec: ConfectionRecipeVariationSpec) => void;
  /** Callback when save is requested with a specific mode */
  readonly onSave: (mode: ConfectionSaveMode) => void;
  /** Callback when cancel is requested */
  readonly onCancel: () => void;
  /** Optional callback invoked after every mutation (undo, redo, or field edit). */
  readonly onMutation?: () => void;
  /** If true, the source entity is read-only */
  readonly readOnly?: boolean;
  /** Callback after any mutation for parent state tracking */
  readonly onMutate?: () => void;
  /** Available ingredients for datalist suggestions (coatings, enrobing chocolate) */
  readonly availableIngredients?: ReadonlyArray<LibraryRuntime.AnyIngredient>;
  /** Available filling recipes for datalist suggestions */
  readonly availableFillings?: ReadonlyArray<LibraryRuntime.FillingRecipe>;
  /** Available procedures for datalist suggestions */
  readonly availableProcedures?: ReadonlyArray<LibraryRuntime.IProcedure>;
  /** Available molds for datalist suggestions (molded bon-bons) */
  readonly availableMolds?: ReadonlyArray<LibraryRuntime.IMold>;
  /** Available decorations for datalist suggestions */
  readonly availableDecorations?: ReadonlyArray<LibraryRuntime.IDecoration>;
  /** Called when typed filling name doesn't match — open create form with seed text */
  readonly onAddFilling?: (seed: string) => void;
  /** Called when typed ingredient name doesn't match — open create form with seed text */
  readonly onAddIngredient?: (seed: string) => void;
  /** Called when typed procedure name doesn't match — open create form with seed text */
  readonly onAddProcedure?: (seed: string) => void;
  /** Called when typed mold name doesn't match — open create form with seed text */
  readonly onAddMold?: (seed: string) => void;
  /** Called when typed decoration name doesn't match — open create form with seed text */
  readonly onAddDecoration?: (seed: string) => void;
  /** Callback when a filling recipe is clicked for drill-down */
  readonly onFillingClick?: (id: FillingId) => void;
  /** Callback when an ingredient is clicked for drill-down */
  readonly onIngredientClick?: (id: IngredientId) => void;
  /** Callback when a mold is clicked for drill-down */
  readonly onMoldClick?: (id: MoldId) => void;
  /** Callback when a procedure is clicked for drill-down */
  readonly onProcedureClick?: (id: ProcedureId) => void;
  /** Callback when a decoration is clicked for drill-down */
  readonly onDecorationClick?: (id: DecorationId) => void;
}

// ============================================================================
// ConfectionEditView Component
// ============================================================================

/**
 * Edit view for confection recipes — variation curation.
 * Provides variation chips with golden star toggles, remove buttons, inline name editing,
 * and an "Add Variation" form with "Create Blank" and "Duplicate Current" options.
 * Also provides recipe-level field editing (name, description, tags, urls).
 * @public
 */
export function ConfectionEditView({
  wrapper,
  confection,
  selectedVariationSpec,
  onVariationChange,
  onSave,
  onCancel,
  onMutation,
  readOnly = false,
  onMutate,
  availableIngredients = [],
  availableFillings = [],
  availableProcedures = [],
  availableMolds = [],
  availableDecorations = [],
  onAddFilling,
  onAddIngredient,
  onAddProcedure,
  onAddMold,
  onAddDecoration,
  onFillingClick,
  onIngredientClick,
  onMoldClick,
  onProcedureClick,
  onDecorationClick
}: IConfectionEditViewProps): React.ReactElement {
  const {
    data: { logger }
  } = useWorkspace();
  const ctx = useEditingContext({
    onSave: (): void => onSave('update'),
    onCancel,
    onMutation,
    wrapper,
    readOnly,
    logger,
    checkHasChanges: (w) => w.hasChanges(w.initial)
  });
  const inputsDisabled = readOnly;

  // ---- Change indicators ----

  const changes = useMemo(() => wrapper.getChanges(wrapper.initial), [wrapper, ctx.version]);

  const changeIndicators: ReadonlyArray<IChangeIndicator> = useMemo(
    () => [
      { key: 'name', label: 'Name', icon: <TagIcon />, changed: changes.nameChanged },
      {
        key: 'description',
        label: 'Description',
        icon: <DocumentTextIcon />,
        changed: changes.descriptionChanged
      },
      { key: 'tags', label: 'Tags', icon: <HashtagIcon />, changed: changes.tagsChanged },
      { key: 'urls', label: 'URLs', icon: <LinkIcon />, changed: changes.urlsChanged },
      {
        key: 'goldenVariation',
        label: 'Golden Variation',
        icon: <TagIcon />,
        changed: changes.goldenVariationSpecChanged
      },
      { key: 'variations', label: 'Variations', icon: <TagIcon />, changed: changes.variationsChanged }
    ],
    [changes]
  );

  const notifyWrapper = useCallback((): void => {
    ctx.notifyMutation();
    onMutate?.();
  }, [ctx, onMutate]);

  // ---- Add Variation form state ----
  const [showAddVariationForm, setShowAddVariationForm] = useState(false);
  const [newVariationDate, setNewVariationDate] = useState('');
  const [newVariationName, setNewVariationName] = useState('');

  // ---- Pending new filling disambiguation state ----
  // When the user types something that doesn't match any existing filling or ingredient,
  // we need to ask whether they want to create a recipe or an ingredient.
  const [pendingNewFilling, setPendingNewFilling] = useState<{ seed: string; slotId?: string } | null>(null);

  // ---- Pending new slot state: filling chosen, awaiting slot name confirmation ----
  const [pendingNewSlot, setPendingNewSlot] = useState<{
    slotName: string;
    option: Entities.Confections.AnyFillingOptionEntity;
    optionId: Entities.Confections.FillingOptionId;
  } | null>(null);
  const [pendingNewSlotName, setPendingNewSlotName] = useState('');

  // ---- Inline name editing state ----
  const [editingVariationName, setEditingVariationName] = useState<ConfectionRecipeVariationSpec | null>(
    null
  );
  const [editingVariationNameValue, setEditingVariationNameValue] = useState('');

  // ============================================================================
  // Recipe-Level Handlers
  // ============================================================================

  const handleNameChange = useCallback(
    (value: string): void => {
      wrapper.setName(value as ConfectionName);
      notifyWrapper();
    },
    [wrapper, notifyWrapper]
  );

  const handleDescriptionChange = useCallback(
    (value: string): void => {
      wrapper.setDescription(value || undefined);
      notifyWrapper();
    },
    [wrapper, notifyWrapper]
  );

  const handleTagsChange = useCallback(
    (tags: ReadonlyArray<string> | undefined): void => {
      wrapper.setTags(tags ? [...tags] : undefined);
      notifyWrapper();
    },
    [wrapper, notifyWrapper]
  );

  // ============================================================================
  // Variation Management Handlers
  // ============================================================================

  const handleSetGoldenVariation = useCallback(
    (spec: ConfectionRecipeVariationSpec): void => {
      wrapper.setGoldenVariationSpec(spec);
      notifyWrapper();
    },
    [wrapper, notifyWrapper]
  );

  const handleRemoveVariation = useCallback(
    (spec: ConfectionRecipeVariationSpec): void => {
      wrapper.removeVariation(spec);
      notifyWrapper();
    },
    [wrapper, notifyWrapper]
  );

  const handleCommitVariationName = useCallback(
    (spec: ConfectionRecipeVariationSpec, name: string): void => {
      wrapper.setVariationName(spec, name || undefined);
      notifyWrapper();
      setEditingVariationName(null);
      setEditingVariationNameValue('');
    },
    [wrapper, notifyWrapper]
  );

  const handleCreateBlankVariation = useCallback((): void => {
    const date = newVariationDate || undefined;
    const name = newVariationName.trim() || undefined;
    const result = wrapper.createBlankVariation({ date, name });
    if (result.isSuccess()) {
      notifyWrapper();
      onVariationChange(result.value);
      setShowAddVariationForm(false);
      setNewVariationDate('');
      setNewVariationName('');
    }
  }, [wrapper, newVariationDate, newVariationName, notifyWrapper, onVariationChange]);

  const handleDuplicateVariation = useCallback((): void => {
    const date = newVariationDate || undefined;
    const name = newVariationName.trim() || undefined;
    const result = wrapper.duplicateVariation(selectedVariationSpec, { date, name });
    if (result.isSuccess()) {
      notifyWrapper();
      onVariationChange(result.value);
      setShowAddVariationForm(false);
      setNewVariationDate('');
      setNewVariationName('');
    }
  }, [wrapper, selectedVariationSpec, newVariationDate, newVariationName, notifyWrapper, onVariationChange]);

  // ============================================================================
  // Variation-Level Handlers
  // ============================================================================

  const currentVariation = useMemo(
    () => wrapper.variations.find((v) => v.variationSpec === selectedVariationSpec),
    [wrapper.variations, selectedVariationSpec, ctx.version]
  );

  const ingredientSuggestions = useMemo(
    () => availableIngredients.map((i) => ({ id: i.id, name: i.name })),
    [availableIngredients]
  );
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
  const procedureSuggestions = useMemo(
    () => availableProcedures.map((p) => ({ id: p.id, name: p.name })),
    [availableProcedures]
  );

  const moldSuggestions = useMemo(
    () => availableMolds.map((m) => ({ id: m.id, name: m.displayName })),
    [availableMolds]
  );

  const decorationSuggestions = useMemo(
    () => availableDecorations.map((d) => ({ id: d.id, name: d.name })),
    [availableDecorations]
  );

  const ingredientMatcher = useTypeaheadMatch(ingredientSuggestions);
  const fillingOptionMatcher = useTypeaheadMatch(
    fillingOptionSuggestions as ReadonlyArray<{ id: string; name: string }>
  );
  const procedureMatcher = useTypeaheadMatch(procedureSuggestions);
  const moldMatcher = useTypeaheadMatch(moldSuggestions);
  const decorationMatcher = useTypeaheadMatch(decorationSuggestions);

  const handleYieldCountChange = useCallback(
    (value: string): void => {
      if (!currentVariation) return;
      const count = parseInt(value, 10);
      if (!isNaN(count) && count > 0) {
        wrapper.setVariationYield(selectedVariationSpec, { ...currentVariation.yield, count });
        notifyWrapper();
      }
    },
    [wrapper, selectedVariationSpec, currentVariation, notifyWrapper]
  );

  const handleNotesChange = useCallback(
    (notes: ReadonlyArray<Model.ICategorizedNote> | undefined): void => {
      wrapper.setVariationNotes(selectedVariationSpec, notes);
      notifyWrapper();
    },
    [wrapper, selectedVariationSpec, notifyWrapper]
  );

  const handleAddProcedure = useCallback(
    (input: string): void => {
      const match = procedureMatcher.resolveOnBlur(input);
      if (!match) {
        if (input.trim()) onAddProcedure?.(input.trim());
        return;
      }
      const current = currentVariation?.procedures;
      const currentOptions = current?.options ?? [];
      if (currentOptions.some((o) => o.id === match.id)) return;
      const newOptions = [...currentOptions, { id: match.id as ProcedureId }];
      const preferredId = current?.preferredId ?? (match.id as ProcedureId);
      wrapper.setVariationProcedures(selectedVariationSpec, { options: newOptions, preferredId });
      notifyWrapper();
    },
    [wrapper, selectedVariationSpec, currentVariation, procedureMatcher, notifyWrapper]
  );

  const handleRemoveProcedure = useCallback(
    (removeId: ProcedureId): void => {
      const current = currentVariation?.procedures;
      if (!current) return;
      const newOptions = current.options.filter((o) => o.id !== removeId);
      const newPreferred =
        current.preferredId === removeId
          ? (newOptions[0]?.id as ProcedureId | undefined)
          : current.preferredId;
      wrapper.setVariationProcedures(
        selectedVariationSpec,
        newOptions.length > 0 ? { options: newOptions, preferredId: newPreferred! } : undefined
      );
      notifyWrapper();
    },
    [wrapper, selectedVariationSpec, currentVariation, notifyWrapper]
  );

  const handleAddFilling = useCallback(
    (input: string): void => {
      const match = fillingOptionMatcher.resolveOnBlur(input);
      if (!match) {
        if (input.trim()) setPendingNewFilling({ seed: input.trim() });
        return;
      }
      const current = currentVariation?.fillings ?? [];
      if (current.some((s) => s.filling.options.some((o) => o.id === match.id))) return;
      const typed = fillingOptionById.get(match.id);
      if (!typed) return;
      const option: Entities.Confections.AnyFillingOptionEntity =
        typed.fillingType === 'ingredient'
          ? { type: 'ingredient' as const, id: typed.ingredientId }
          : { type: 'recipe' as const, id: typed.fillingId };
      const slotNumber = current.length + 1;
      const defaultName = `Layer ${slotNumber}`;
      setPendingNewSlot({
        slotName: defaultName,
        option,
        optionId: typed.id as Entities.Confections.FillingOptionId
      });
      setPendingNewSlotName(defaultName);
    },
    [currentVariation, fillingOptionMatcher, fillingOptionById]
  );

  const handleCommitNewSlot = useCallback((): void => {
    if (!pendingNewSlot) return;
    const current = currentVariation?.fillings ?? [];
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
    wrapper.setVariationFillings(selectedVariationSpec, [...current, newSlot]);
    notifyWrapper();
    setPendingNewSlot(null);
    setPendingNewSlotName('');
  }, [wrapper, selectedVariationSpec, currentVariation, pendingNewSlot, pendingNewSlotName, notifyWrapper]);

  const handleSetEnrobingChocolate = useCallback(
    (input: string): void => {
      const match = ingredientMatcher.resolveOnBlur(input);
      if (!match) {
        if (input.trim()) onAddIngredient?.(input.trim());
        return;
      }
      const current = currentVariation;
      if (
        !current ||
        (!EntitiesNS.Confections.isRolledTruffleRecipeVariationEntity(current) &&
          !EntitiesNS.Confections.isBarTruffleRecipeVariationEntity(current))
      )
        return;
      const existing = current.enrobingChocolate;
      const ids = existing?.ids.includes(match.id as IngredientId)
        ? existing.ids
        : [...(existing?.ids ?? []), match.id as IngredientId];
      wrapper.setVariationEnrobingChocolate(selectedVariationSpec, {
        ids,
        preferredId: match.id as IngredientId
      });
      notifyWrapper();
    },
    [wrapper, selectedVariationSpec, currentVariation, ingredientMatcher, notifyWrapper]
  );

  const handleClearEnrobingChocolate = useCallback((): void => {
    wrapper.setVariationEnrobingChocolate(selectedVariationSpec, undefined);
    notifyWrapper();
  }, [wrapper, selectedVariationSpec, notifyWrapper]);

  const handleAddCoating = useCallback(
    (input: string): void => {
      const match = ingredientMatcher.resolveOnBlur(input);
      if (!match) {
        if (input.trim()) onAddIngredient?.(input.trim());
        return;
      }
      const current = currentVariation;
      if (!current || !EntitiesNS.Confections.isRolledTruffleRecipeVariationEntity(current)) return;
      const existing = current.coatings;
      if (existing?.ids.includes(match.id as IngredientId)) return;
      const ids = [...(existing?.ids ?? []), match.id as IngredientId];
      const preferredId = existing?.preferredId ?? (match.id as IngredientId);
      wrapper.setVariationCoatings(selectedVariationSpec, { ids, preferredId });
      notifyWrapper();
    },
    [wrapper, selectedVariationSpec, currentVariation, ingredientMatcher, notifyWrapper]
  );

  const handleRemoveCoating = useCallback(
    (removeId: IngredientId): void => {
      const current = currentVariation;
      if (!current || !EntitiesNS.Confections.isRolledTruffleRecipeVariationEntity(current)) return;
      const existing = current.coatings;
      if (!existing) return;
      const ids = existing.ids.filter((id: IngredientId) => id !== removeId);
      const preferredId =
        existing.preferredId === removeId ? (ids[0] as IngredientId | undefined) : existing.preferredId;
      wrapper.setVariationCoatings(
        selectedVariationSpec,
        ids.length > 0 ? { ids, preferredId: preferredId! } : undefined
      );
      notifyWrapper();
    },
    [wrapper, selectedVariationSpec, currentVariation, notifyWrapper]
  );

  const isMoldedBonBon =
    currentVariation !== undefined &&
    EntitiesNS.Confections.isMoldedBonBonRecipeVariationEntity(currentVariation);
  const isRolledTruffle =
    currentVariation !== undefined &&
    EntitiesNS.Confections.isRolledTruffleRecipeVariationEntity(currentVariation);
  const isBarTruffle =
    currentVariation !== undefined &&
    EntitiesNS.Confections.isBarTruffleRecipeVariationEntity(currentVariation);

  const handleSetPreferredProcedure = useCallback(
    (procId: ProcedureId): void => {
      const current = currentVariation?.procedures;
      if (!current) return;
      wrapper.setVariationProcedures(selectedVariationSpec, { ...current, preferredId: procId });
      notifyWrapper();
    },
    [wrapper, selectedVariationSpec, currentVariation, notifyWrapper]
  );

  const handleAddFillingAlternate = useCallback(
    (slotId: string, input: string): void => {
      const match = fillingOptionMatcher.resolveOnBlur(input);
      if (!match) {
        if (input.trim()) setPendingNewFilling({ seed: input.trim(), slotId });
        return;
      }
      const current = currentVariation?.fillings ?? [];
      const slotIdx = current.findIndex((s) => s.slotId === slotId);
      if (slotIdx < 0) return;
      const slot = current[slotIdx]!;
      if (slot.filling.options.some((o) => o.id === match.id)) return;
      const typed = fillingOptionById.get(match.id);
      if (!typed) return;
      const option: Entities.Confections.AnyFillingOptionEntity =
        typed.fillingType === 'ingredient'
          ? { type: 'ingredient' as const, id: typed.ingredientId }
          : { type: 'recipe' as const, id: typed.fillingId };
      const newOptions = [...slot.filling.options, option];
      const updated = [...current];
      updated[slotIdx] = { ...slot, filling: { ...slot.filling, options: newOptions } };
      wrapper.setVariationFillings(selectedVariationSpec, updated);
      notifyWrapper();
    },
    [
      wrapper,
      selectedVariationSpec,
      currentVariation,
      fillingOptionMatcher,
      fillingOptionById,
      notifyWrapper,
      onAddFilling
    ]
  );

  const handleRemoveFillingOption = useCallback(
    (slotId: string, optionId: string): void => {
      const current = currentVariation?.fillings ?? [];
      const slotIdx = current.findIndex((s) => s.slotId === slotId);
      if (slotIdx < 0) return;
      const slot = current[slotIdx]!;
      const newOptions = slot.filling.options.filter((o) => o.id !== optionId);
      if (newOptions.length === 0) {
        const updated = current.filter((s) => s.slotId !== slotId);
        wrapper.setVariationFillings(selectedVariationSpec, updated.length > 0 ? updated : undefined);
      } else {
        const newPreferred =
          slot.filling.preferredId === optionId ? newOptions[0]!.id : slot.filling.preferredId;
        const updated = [...current];
        updated[slotIdx] = { ...slot, filling: { options: newOptions, preferredId: newPreferred } };
        wrapper.setVariationFillings(selectedVariationSpec, updated);
      }
      notifyWrapper();
    },
    [wrapper, selectedVariationSpec, currentVariation, notifyWrapper]
  );

  const handleSetPreferredFillingOption = useCallback(
    (slotId: string, optionId: string): void => {
      const current = currentVariation?.fillings ?? [];
      const slotIdx = current.findIndex((s) => s.slotId === slotId);
      if (slotIdx < 0) return;
      const slot = current[slotIdx]!;
      const updated = [...current];
      updated[slotIdx] = {
        ...slot,
        filling: { ...slot.filling, preferredId: optionId as Entities.Confections.FillingOptionId }
      };
      wrapper.setVariationFillings(selectedVariationSpec, updated);
      notifyWrapper();
    },
    [wrapper, selectedVariationSpec, currentVariation, notifyWrapper]
  );

  const handleSetShellChocolate = useCallback(
    (input: string): void => {
      const match = ingredientMatcher.resolveOnBlur(input);
      if (!match) return;
      const current = currentVariation;
      if (!current || !EntitiesNS.Confections.isMoldedBonBonRecipeVariationEntity(current)) return;
      const existing = current.shellChocolate;
      const ids = existing.ids.includes(match.id as IngredientId)
        ? existing.ids
        : [...existing.ids, match.id as IngredientId];
      wrapper.setVariationShellChocolate(selectedVariationSpec, {
        ids,
        preferredId: match.id as IngredientId
      });
      notifyWrapper();
    },
    [wrapper, selectedVariationSpec, currentVariation, ingredientMatcher, notifyWrapper]
  );

  const handleAddShellChocolateAlternate = useCallback(
    (input: string): void => {
      const match = ingredientMatcher.resolveOnBlur(input);
      if (!match) return;
      const current = currentVariation;
      if (!current || !EntitiesNS.Confections.isMoldedBonBonRecipeVariationEntity(current)) return;
      const existing = current.shellChocolate;
      if (existing.ids.includes(match.id as IngredientId)) return;
      wrapper.setVariationShellChocolate(selectedVariationSpec, {
        ids: [...existing.ids, match.id as IngredientId],
        preferredId: existing.preferredId
      });
      notifyWrapper();
    },
    [wrapper, selectedVariationSpec, currentVariation, ingredientMatcher, notifyWrapper]
  );

  const handleRemoveShellChocolate = useCallback(
    (removeId: IngredientId): void => {
      const current = currentVariation;
      if (!current || !EntitiesNS.Confections.isMoldedBonBonRecipeVariationEntity(current)) return;
      const existing = current.shellChocolate;
      const ids = existing.ids.filter((id) => id !== removeId);
      if (ids.length === 0) return;
      const newPreferred = existing.preferredId === removeId ? ids[0]! : existing.preferredId;
      wrapper.setVariationShellChocolate(selectedVariationSpec, { ids, preferredId: newPreferred });
      notifyWrapper();
    },
    [wrapper, selectedVariationSpec, currentVariation, notifyWrapper]
  );

  const handleSetPreferredShellChocolate = useCallback(
    (id: IngredientId): void => {
      const current = currentVariation;
      if (!current || !EntitiesNS.Confections.isMoldedBonBonRecipeVariationEntity(current)) return;
      wrapper.setVariationShellChocolate(selectedVariationSpec, {
        ...current.shellChocolate,
        preferredId: id
      });
      notifyWrapper();
    },
    [wrapper, selectedVariationSpec, currentVariation, notifyWrapper]
  );

  const handleSetAdditionalChocolate = useCallback(
    (purpose: import('@fgv/ts-chocolate').AdditionalChocolatePurpose, input: string): void => {
      const match = ingredientMatcher.resolveOnBlur(input);
      if (!match) return;
      const current = currentVariation;
      if (!current || !EntitiesNS.Confections.isMoldedBonBonRecipeVariationEntity(current)) return;
      const existing = current.additionalChocolates ?? [];
      const idx = existing.findIndex((ac) => ac.purpose === purpose);
      const newEntry: Entities.Confections.IAdditionalChocolateEntity = {
        purpose,
        chocolate: { ids: [match.id as IngredientId], preferredId: match.id as IngredientId }
      };
      const updated =
        idx >= 0 ? existing.map((ac, i) => (i === idx ? newEntry : ac)) : [...existing, newEntry];
      wrapper.setVariationAdditionalChocolates(selectedVariationSpec, updated);
      notifyWrapper();
    },
    [wrapper, selectedVariationSpec, currentVariation, ingredientMatcher, notifyWrapper]
  );

  const handleRemoveAdditionalChocolate = useCallback(
    (purpose: import('@fgv/ts-chocolate').AdditionalChocolatePurpose): void => {
      const current = currentVariation;
      if (!current || !EntitiesNS.Confections.isMoldedBonBonRecipeVariationEntity(current)) return;
      const updated = (current.additionalChocolates ?? []).filter((ac) => ac.purpose !== purpose);
      wrapper.setVariationAdditionalChocolates(
        selectedVariationSpec,
        updated.length > 0 ? updated : undefined
      );
      notifyWrapper();
    },
    [wrapper, selectedVariationSpec, currentVariation, notifyWrapper]
  );

  const handleAddDecoration = useCallback(
    (input: string): void => {
      const match = decorationMatcher.resolveOnBlur(input);
      if (!match) {
        if (input.trim()) onAddDecoration?.(input.trim());
        return;
      }
      const current = currentVariation?.decorations;
      const currentOptions = current?.options ?? [];
      if (currentOptions.some((o) => o.id === match.id)) return;
      const newOptions = [...currentOptions, { id: match.id as DecorationId }];
      const preferredId = current?.preferredId ?? (match.id as DecorationId);
      wrapper.setVariationDecorations(selectedVariationSpec, { options: newOptions, preferredId });
      notifyWrapper();
    },
    [wrapper, selectedVariationSpec, currentVariation, decorationMatcher, notifyWrapper, onAddDecoration]
  );

  const handleRemoveDecoration = useCallback(
    (removeId: DecorationId): void => {
      const current = currentVariation?.decorations;
      if (!current) return;
      const newOptions = current.options.filter((o) => o.id !== removeId);
      const newPreferred =
        current.preferredId === removeId
          ? (newOptions[0]?.id as DecorationId | undefined)
          : current.preferredId;
      wrapper.setVariationDecorations(
        selectedVariationSpec,
        newOptions.length > 0 ? { options: newOptions, preferredId: newPreferred! } : undefined
      );
      notifyWrapper();
    },
    [wrapper, selectedVariationSpec, currentVariation, notifyWrapper]
  );

  const handleSetPreferredDecoration = useCallback(
    (id: DecorationId): void => {
      const current = currentVariation?.decorations;
      if (!current) return;
      wrapper.setVariationDecorations(selectedVariationSpec, { ...current, preferredId: id });
      notifyWrapper();
    },
    [wrapper, selectedVariationSpec, currentVariation, notifyWrapper]
  );

  const handleSetPreferredMold = useCallback(
    (moldId: MoldId): void => {
      const current = currentVariation;
      if (!current || !EntitiesNS.Confections.isMoldedBonBonRecipeVariationEntity(current)) return;
      const existing = current.molds;
      const options = existing.options.some((o) => o.id === moldId)
        ? existing.options
        : [...existing.options, { id: moldId }];
      wrapper.setVariationMolds(selectedVariationSpec, { options, preferredId: moldId });
      notifyWrapper();
    },
    [wrapper, selectedVariationSpec, currentVariation, notifyWrapper]
  );

  const handleAddMold = useCallback(
    (input: string): void => {
      const match = moldMatcher.resolveOnBlur(input);
      if (!match) {
        if (input.trim()) onAddMold?.(input.trim());
        return;
      }
      const current = currentVariation;
      if (!current || !EntitiesNS.Confections.isMoldedBonBonRecipeVariationEntity(current)) return;
      const existing = current.molds;
      if (existing.options.some((o) => o.id === match.id)) return;
      const newOptions = [...existing.options, { id: match.id as MoldId }];
      wrapper.setVariationMolds(selectedVariationSpec, {
        options: newOptions,
        preferredId: existing.preferredId
      });
      notifyWrapper();
    },
    [wrapper, selectedVariationSpec, currentVariation, moldMatcher, notifyWrapper, onAddMold]
  );

  const handleRemoveMold = useCallback(
    (removeMoldId: MoldId): void => {
      const current = currentVariation;
      if (!current || !EntitiesNS.Confections.isMoldedBonBonRecipeVariationEntity(current)) return;
      const existing = current.molds;
      const newOptions = existing.options.filter((o) => o.id !== removeMoldId);
      if (newOptions.length === 0) return;
      const newPreferred =
        existing.preferredId === removeMoldId ? (newOptions[0]!.id as MoldId) : existing.preferredId;
      wrapper.setVariationMolds(selectedVariationSpec, { options: newOptions, preferredId: newPreferred });
      notifyWrapper();
    },
    [wrapper, selectedVariationSpec, currentVariation, notifyWrapper]
  );

  // ============================================================================
  // Save button
  // ============================================================================

  const saveActions = useMemo(() => {
    const actions: Array<{
      id: string;
      label: string;
      icon: React.ReactElement;
      onSelect: () => void;
    }> = [];

    if (!readOnly) {
      actions.push({
        id: 'update',
        label: 'Save',
        icon: <CheckIcon className="h-3.5 w-3.5" />,
        onSelect: (): void => onSave('update')
      });

      actions.push({
        id: 'new-variation',
        label: 'Save as New Variation',
        icon: <PlusIcon className="h-3.5 w-3.5" />,
        onSelect: (): void => onSave('new-variation')
      });
    }

    actions.push({
      id: 'new-recipe',
      label: 'Save as New Recipe',
      icon: <DocumentDuplicateIcon className="h-3.5 w-3.5" />,
      onSelect: (): void => onSave('new-recipe')
    });

    return actions;
  }, [onSave, readOnly]);

  const customSaveButton =
    saveActions.length > 0 ? (
      <MultiActionButton
        primaryAction={saveActions[0]}
        alternativeActions={saveActions.slice(1)}
        variant="primary"
      />
    ) : undefined;

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="flex flex-col p-4 overflow-y-auto h-full">
      <EditingToolbar context={ctx} changeIndicators={changeIndicators} customSaveButton={customSaveButton} />

      {/* Derived-from indicator */}
      {wrapper.current.derivedFrom && (
        <div className="px-1 py-1">
          <DerivedFromIndicator
            sourceVariationId={wrapper.current.derivedFrom.sourceVariationId}
            derivedDate={wrapper.current.derivedFrom.derivedDate}
          />
        </div>
      )}

      {/* Identity Section */}
      <EditSection title="Identity">
        <EditField label="Base ID">
          <span className="text-sm font-mono text-gray-500">{wrapper.current.baseId}</span>
        </EditField>
        <EditField label="Name">
          <TextInput
            value={wrapper.current.name}
            onChange={handleNameChange}
            placeholder="e.g. Classic Dark Dome Bonbon"
          />
        </EditField>
        <EditField label="Description">
          <TextInput
            value={wrapper.current.description ?? ''}
            onChange={handleDescriptionChange}
            placeholder="Optional description"
          />
        </EditField>
        <EditField label="Tags">
          <TagsInput
            value={wrapper.current.tags ? [...wrapper.current.tags] : []}
            onChange={handleTagsChange}
            placeholder="Add tag..."
          />
        </EditField>
      </EditSection>

      {/* Variation Selector / Curation */}
      {(wrapper.variations.length > 1 || !inputsDisabled) && (
        <EditSection title="Variations">
          <div className="flex flex-wrap gap-1.5 items-start">
            {wrapper.variations.map((v) => {
              const isSelected = v.variationSpec === selectedVariationSpec;
              const isGolden = v.variationSpec === wrapper.goldenVariationSpec;
              const canRemove = !inputsDisabled && !isGolden && wrapper.variations.length > 1;
              const isEditingName = editingVariationName === v.variationSpec;

              return (
                <div
                  key={v.variationSpec}
                  className={`inline-flex items-center gap-0.5 rounded border text-xs transition-colors ${
                    isSelected
                      ? 'bg-choco-primary text-white border-choco-primary'
                      : 'bg-white text-gray-600 border-gray-300'
                  }`}
                >
                  {/* Golden star toggle */}
                  {!inputsDisabled && (
                    <button
                      type="button"
                      title={isGolden ? 'Golden variation' : 'Set as golden'}
                      onClick={(): void => handleSetGoldenVariation(v.variationSpec)}
                      className={`pl-1.5 py-1 shrink-0 ${
                        isGolden
                          ? isSelected
                            ? 'text-amber-300'
                            : 'text-amber-500'
                          : isSelected
                          ? 'text-white/40 hover:text-amber-300'
                          : 'text-gray-300 hover:text-amber-400'
                      }`}
                    >
                      ★
                    </button>
                  )}
                  {/* Golden star display (read-only) */}
                  {inputsDisabled && isGolden && (
                    <span
                      className={`pl-1.5 py-1 shrink-0 ${isSelected ? 'text-amber-300' : 'text-amber-500'}`}
                    >
                      ★
                    </span>
                  )}

                  {/* Variation label — click to select, double-click to rename */}
                  {isEditingName ? (
                    <input
                      autoFocus
                      type="text"
                      className="text-xs px-1 py-0.5 w-28 bg-white text-gray-800 border-0 outline-none rounded"
                      value={editingVariationNameValue}
                      onChange={(e): void => setEditingVariationNameValue(e.target.value)}
                      onBlur={(): void =>
                        handleCommitVariationName(v.variationSpec, editingVariationNameValue)
                      }
                      onKeyDown={(e): void => {
                        if (e.key === 'Enter')
                          handleCommitVariationName(v.variationSpec, editingVariationNameValue);
                        if (e.key === 'Escape') {
                          setEditingVariationName(null);
                          setEditingVariationNameValue('');
                        }
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={(): void => onVariationChange(v.variationSpec)}
                      onDoubleClick={(): void => {
                        if (!inputsDisabled) {
                          setEditingVariationName(v.variationSpec);
                          setEditingVariationNameValue(v.name ?? '');
                        }
                      }}
                      className={`px-1.5 py-1 ${isSelected ? '' : 'hover:border-choco-primary'}`}
                      title={!inputsDisabled ? 'Click to select, double-click to rename' : undefined}
                    >
                      {v.name ?? v.variationSpec}
                    </button>
                  )}

                  {/* Remove button (non-golden only) */}
                  {canRemove && (
                    <button
                      type="button"
                      title="Remove variation"
                      onClick={(): void => handleRemoveVariation(v.variationSpec)}
                      className={`pr-1 py-1 shrink-0 ${
                        isSelected ? 'text-white/60 hover:text-white' : 'text-gray-300 hover:text-red-400'
                      }`}
                    >
                      ✕
                    </button>
                  )}
                  {!canRemove && !isEditingName && <span className="pr-1" />}
                </div>
              );
            })}

            {/* Add Variation button / form */}
            {!inputsDisabled && (
              <>
                {!showAddVariationForm ? (
                  <button
                    type="button"
                    onClick={(): void => setShowAddVariationForm(true)}
                    className="px-2.5 py-1 text-xs rounded border border-dashed border-gray-300 text-gray-400 hover:border-choco-primary hover:text-choco-primary transition-colors"
                  >
                    + New
                  </button>
                ) : (
                  <div className="w-full mt-1 p-2 rounded border border-gray-200 bg-gray-50 space-y-2">
                    <div className="flex gap-2 items-center">
                      <label className="text-xs text-gray-500 shrink-0 w-10">Date</label>
                      <input
                        type="text"
                        placeholder={new Date().toISOString().split('T')[0]}
                        pattern="\d{4}-\d{2}-\d{2}"
                        className="text-xs border border-gray-300 rounded px-1.5 py-0.5 w-32 focus:outline-none focus:ring-1 focus:ring-choco-primary"
                        value={newVariationDate}
                        onChange={(e): void => setNewVariationDate(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2 items-center">
                      <label className="text-xs text-gray-500 shrink-0 w-10">Name</label>
                      <input
                        type="text"
                        placeholder="optional label"
                        className="text-xs border border-gray-300 rounded px-1.5 py-0.5 flex-1 focus:outline-none focus:ring-1 focus:ring-choco-primary"
                        value={newVariationName}
                        onChange={(e): void => setNewVariationName(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-1.5 justify-end">
                      <button
                        type="button"
                        onClick={(): void => {
                          setShowAddVariationForm(false);
                          setNewVariationDate('');
                          setNewVariationName('');
                        }}
                        className="px-2 py-0.5 text-xs text-gray-500 hover:text-gray-700 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateBlankVariation}
                        className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        Create Blank
                      </button>
                      <button
                        type="button"
                        onClick={handleDuplicateVariation}
                        className="px-2 py-0.5 text-xs rounded bg-choco-primary text-white hover:bg-choco-primary/90"
                      >
                        Duplicate Current
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </EditSection>
      )}

      {/* Variation Detail — editable sections */}
      {currentVariation && (
        <>
          {/* Yield */}
          <EditSection title="Yield">
            <EditField label="Count">
              <input
                type="number"
                min={1}
                className="text-sm border border-gray-300 rounded px-2 py-1 w-24 focus:outline-none focus:ring-1 focus:ring-choco-primary"
                value={currentVariation.yield.count}
                onChange={(e): void => handleYieldCountChange(e.target.value)}
                disabled={inputsDisabled}
              />
            </EditField>
          </EditSection>

          {/* Molds (molded bon-bon only) — primary card + alternates chips */}
          {isMoldedBonBon &&
            (() => {
              const v = currentVariation as Entities.Confections.IMoldedBonBonRecipeVariationEntity;
              const preferred =
                v.molds.options.find((o) => o.id === v.molds.preferredId) ?? v.molds.options[0];
              const alternates = v.molds.options.filter((o) => o.id !== preferred?.id);
              return (
                <EditSection title="Mold">
                  <div className="rounded border border-gray-200 p-2 space-y-1.5">
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-medium text-gray-800">
                        {moldSuggestions.find((s) => s.id === preferred?.id)?.name ?? preferred?.id ?? '—'}
                      </span>
                    </div>
                    {!inputsDisabled && (
                      <input
                        type="text"
                        placeholder="Change mold…"
                        className="text-xs border border-dashed border-gray-300 rounded px-2 py-0.5 w-full focus:outline-none focus:ring-1 focus:ring-choco-primary"
                        list="mold-suggestions"
                        onBlur={(e): void => {
                          const val = e.target.value;
                          const m = moldMatcher.resolveOnBlur(val);
                          if (m) {
                            handleSetPreferredMold(m.id as MoldId);
                          } else if (val.trim()) {
                            onAddMold?.(val.trim());
                          }
                          e.target.value = '';
                        }}
                        onKeyDown={(e): void => {
                          if (e.key === 'Enter') {
                            const val = (e.target as HTMLInputElement).value;
                            const m = moldMatcher.resolveOnBlur(val);
                            if (m) {
                              handleSetPreferredMold(m.id as MoldId);
                            } else if (val.trim()) {
                              onAddMold?.(val.trim());
                            }
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                    )}
                    <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-gray-100">
                      <span className="text-xs text-gray-400 shrink-0">also:</span>
                      {alternates.map((moldRef) => (
                        <span
                          key={moldRef.id}
                          className="inline-flex items-center gap-0.5 text-xs rounded px-1.5 py-0.5 bg-gray-100 text-gray-600"
                        >
                          {!inputsDisabled && (
                            <button
                              type="button"
                              title="Set as preferred"
                              onClick={(): void => handleSetPreferredMold(moldRef.id as MoldId)}
                              className="text-gray-300 hover:text-amber-400 shrink-0"
                            >
                              ★
                            </button>
                          )}
                          <span>{moldSuggestions.find((s) => s.id === moldRef.id)?.name ?? moldRef.id}</span>
                          {!inputsDisabled && (
                            <button
                              type="button"
                              title="Remove"
                              onClick={(): void => handleRemoveMold(moldRef.id as MoldId)}
                              className="text-gray-300 hover:text-red-400 shrink-0 ml-0.5"
                            >
                              ✕
                            </button>
                          )}
                        </span>
                      ))}
                      {!inputsDisabled && (
                        <input
                          type="text"
                          placeholder="+ alternate"
                          className="text-xs border border-dashed border-gray-200 rounded px-1.5 py-0.5 w-28 focus:outline-none focus:ring-1 focus:ring-choco-primary"
                          list="mold-suggestions"
                          onBlur={(e): void => {
                            handleAddMold(e.target.value);
                            e.target.value = '';
                          }}
                          onKeyDown={(e): void => {
                            if (e.key === 'Enter') {
                              handleAddMold((e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                        />
                      )}
                    </div>
                  </div>
                  <datalist id="mold-suggestions">
                    {moldSuggestions.map((s) => (
                      <option key={s.id} value={s.name} />
                    ))}
                  </datalist>
                </EditSection>
              );
            })()}

          {/* Shell Chocolate (molded bon-bon only) — primary card + alternates chips */}
          {isMoldedBonBon &&
            (() => {
              const v = currentVariation as Entities.Confections.IMoldedBonBonRecipeVariationEntity;
              const sc = v.shellChocolate;
              const preferred = sc.preferredId;
              const alternates = sc.ids.filter((id) => id !== preferred);
              return (
                <EditSection title="Shell Chocolate">
                  <div className="rounded border border-gray-200 p-2 space-y-1.5">
                    <span className="text-sm font-medium text-gray-800">
                      {ingredientSuggestions.find((s) => s.id === preferred)?.name ?? preferred ?? '—'}
                    </span>
                    {!inputsDisabled && (
                      <input
                        type="text"
                        placeholder="Change chocolate…"
                        className="text-xs border border-dashed border-gray-300 rounded px-2 py-0.5 w-full focus:outline-none focus:ring-1 focus:ring-choco-primary"
                        list="ingredient-suggestions"
                        onBlur={(e): void => {
                          handleSetShellChocolate(e.target.value);
                          e.target.value = '';
                        }}
                        onKeyDown={(e): void => {
                          if (e.key === 'Enter') {
                            handleSetShellChocolate((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                    )}
                    <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-gray-100">
                      <span className="text-xs text-gray-400 shrink-0">also:</span>
                      {alternates.map((id) => (
                        <span
                          key={id}
                          className="inline-flex items-center gap-0.5 text-xs rounded px-1.5 py-0.5 bg-gray-100 text-gray-600"
                        >
                          {!inputsDisabled && (
                            <button
                              type="button"
                              title="Set as preferred"
                              onClick={(): void => handleSetPreferredShellChocolate(id as IngredientId)}
                              className="text-gray-300 hover:text-amber-400 shrink-0"
                            >
                              ★
                            </button>
                          )}
                          <span>{ingredientSuggestions.find((s) => s.id === id)?.name ?? id}</span>
                          {!inputsDisabled && (
                            <button
                              type="button"
                              title="Remove"
                              onClick={(): void => handleRemoveShellChocolate(id as IngredientId)}
                              className="text-gray-300 hover:text-red-400 shrink-0 ml-0.5"
                            >
                              ✕
                            </button>
                          )}
                        </span>
                      ))}
                      {!inputsDisabled && (
                        <input
                          type="text"
                          placeholder="+ alternate"
                          className="text-xs border border-dashed border-gray-200 rounded px-1.5 py-0.5 w-28 focus:outline-none focus:ring-1 focus:ring-choco-primary"
                          list="ingredient-suggestions"
                          onBlur={(e): void => {
                            handleAddShellChocolateAlternate(e.target.value);
                            e.target.value = '';
                          }}
                          onKeyDown={(e): void => {
                            if (e.key === 'Enter') {
                              handleAddShellChocolateAlternate((e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                        />
                      )}
                    </div>
                  </div>
                </EditSection>
              );
            })()}

          {/* Additional Chocolates: Seal + Decoration (molded bon-bon only) */}
          {isMoldedBonBon &&
            (() => {
              const v = currentVariation as Entities.Confections.IMoldedBonBonRecipeVariationEntity;
              const purposes: ReadonlyArray<import('@fgv/ts-chocolate').AdditionalChocolatePurpose> = [
                'seal',
                'decoration'
              ];
              return (
                <>
                  {purposes.map((purpose) => {
                    const ac = (v.additionalChocolates ?? []).find((a) => a.purpose === purpose);
                    const preferredId = ac?.chocolate.preferredId;
                    const label = purpose.charAt(0).toUpperCase() + purpose.slice(1);
                    return (
                      <EditSection key={purpose} title={`${label} Chocolate`}>
                        {ac ? (
                          <div className="rounded border border-gray-200 p-2 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-800">
                              {ingredientSuggestions.find((s) => s.id === preferredId)?.name ??
                                preferredId ??
                                '—'}
                            </span>
                            {!inputsDisabled && (
                              <button
                                type="button"
                                onClick={(): void => handleRemoveAdditionalChocolate(purpose)}
                                className="text-xs text-gray-400 hover:text-red-500"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ) : (
                          !inputsDisabled && (
                            <input
                              type="text"
                              placeholder={`Set ${purpose} chocolate…`}
                              className="text-xs border border-dashed border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-choco-primary"
                              list="ingredient-suggestions"
                              onBlur={(e): void => {
                                handleSetAdditionalChocolate(purpose, e.target.value);
                                e.target.value = '';
                              }}
                              onKeyDown={(e): void => {
                                if (e.key === 'Enter') {
                                  handleSetAdditionalChocolate(purpose, (e.target as HTMLInputElement).value);
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }}
                            />
                          )
                        )}
                      </EditSection>
                    );
                  })}
                </>
              );
            })()}

          {/* Fillings — each slot as a card with options chips */}
          <EditSection title="Fillings">
            <div className="space-y-2">
              {(currentVariation.fillings ?? []).map((slot) => (
                <div key={slot.slotId} className="rounded border border-gray-200 p-2 space-y-1.5">
                  <div className="text-xs text-gray-400 font-medium">{slot.name ?? slot.slotId}</div>
                  <div className="flex flex-wrap items-center gap-1">
                    {slot.filling.options.map((opt) => {
                      const isPreferred = opt.id === slot.filling.preferredId;
                      const displayName = fillingSuggestions.find((s) => s.id === opt.id)?.name ?? opt.id;
                      return (
                        <span
                          key={opt.id}
                          className={`inline-flex items-center gap-0.5 text-xs rounded px-1.5 py-0.5 ${
                            isPreferred
                              ? 'bg-choco-primary/10 text-choco-primary'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {!inputsDisabled && (
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
                          {inputsDisabled && isPreferred && (
                            <span className="text-amber-500 shrink-0">★</span>
                          )}
                          <span>{displayName}</span>
                          {!inputsDisabled && (
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
                    {!inputsDisabled &&
                      (pendingNewFilling?.slotId === slot.slotId ? (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                          <span>"{pendingNewFilling.seed}":</span>
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
            {!inputsDisabled &&
              (pendingNewFilling ? (
                <div className="mt-2 rounded border border-amber-200 bg-amber-50 p-2 space-y-1.5">
                  <div className="text-xs text-amber-800">
                    <span className="font-medium">"{pendingNewFilling.seed}"</span> not found.{' '}
                    {pendingNewFilling.slotId ? 'Add as alternate to this slot:' : 'Create as:'}
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

          {/* Enrobing Chocolate (rolled truffle + bar truffle) — primary card + alternates chips */}
          {(isRolledTruffle || isBarTruffle) &&
            (() => {
              const v = currentVariation as
                | Entities.Confections.IRolledTruffleRecipeVariationEntity
                | Entities.Confections.IBarTruffleRecipeVariationEntity;
              const ec = v.enrobingChocolate;
              const preferred = ec?.preferredId;
              const alternates = ec ? ec.ids.filter((id) => id !== preferred) : [];
              return (
                <EditSection title="Enrobing Chocolate">
                  {ec ? (
                    <div className="rounded border border-gray-200 p-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-800">
                          {ingredientSuggestions.find((s) => s.id === preferred)?.name ?? preferred ?? '—'}
                        </span>
                        {!inputsDisabled && (
                          <button
                            type="button"
                            onClick={handleClearEnrobingChocolate}
                            className="text-xs text-gray-400 hover:text-red-500"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-gray-100">
                        <span className="text-xs text-gray-400 shrink-0">also:</span>
                        {alternates.map((id) => (
                          <span
                            key={id}
                            className="inline-flex items-center gap-0.5 text-xs rounded px-1.5 py-0.5 bg-gray-100 text-gray-600"
                          >
                            <span>{ingredientSuggestions.find((s) => s.id === id)?.name ?? id}</span>
                          </span>
                        ))}
                        {!inputsDisabled && (
                          <input
                            type="text"
                            placeholder="+ alternate"
                            className="text-xs border border-dashed border-gray-200 rounded px-1.5 py-0.5 w-28 focus:outline-none focus:ring-1 focus:ring-choco-primary"
                            list="ingredient-suggestions"
                            onBlur={(e): void => {
                              handleSetEnrobingChocolate(e.target.value);
                              e.target.value = '';
                            }}
                            onKeyDown={(e): void => {
                              if (e.key === 'Enter') {
                                handleSetEnrobingChocolate((e.target as HTMLInputElement).value);
                                (e.target as HTMLInputElement).value = '';
                              }
                            }}
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    !inputsDisabled && (
                      <input
                        type="text"
                        placeholder="Set enrobing chocolate…"
                        className="text-xs border border-dashed border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-choco-primary"
                        list="ingredient-suggestions"
                        onBlur={(e): void => {
                          handleSetEnrobingChocolate(e.target.value);
                          e.target.value = '';
                        }}
                        onKeyDown={(e): void => {
                          if (e.key === 'Enter') {
                            handleSetEnrobingChocolate((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                    )
                  )}
                </EditSection>
              );
            })()}

          {/* Coatings (rolled truffle only) — preferred primary + alternates chips */}
          {isRolledTruffle &&
            (() => {
              const v = currentVariation as Entities.Confections.IRolledTruffleRecipeVariationEntity;
              const preferred = v.coatings?.preferredId;
              const alternates = (v.coatings?.ids ?? []).filter((id) => id !== preferred);
              return (
                <EditSection title="Coatings">
                  <div className="space-y-1.5">
                    {preferred && (
                      <div className="rounded border border-gray-200 p-2 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-800">
                            {ingredientSuggestions.find((s) => s.id === preferred)?.name ?? preferred}
                          </span>
                          {!inputsDisabled && (
                            <button
                              type="button"
                              onClick={(): void => handleRemoveCoating(preferred as IngredientId)}
                              className="text-xs text-gray-400 hover:text-red-500"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        {(alternates.length > 0 || !inputsDisabled) && (
                          <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-gray-100">
                            <span className="text-xs text-gray-400 shrink-0">also:</span>
                            {alternates.map((id) => (
                              <span
                                key={id}
                                className="inline-flex items-center gap-0.5 text-xs rounded px-1.5 py-0.5 bg-gray-100 text-gray-600"
                              >
                                <span>{ingredientSuggestions.find((s) => s.id === id)?.name ?? id}</span>
                                {!inputsDisabled && (
                                  <button
                                    type="button"
                                    onClick={(): void => handleRemoveCoating(id as IngredientId)}
                                    className="text-gray-300 hover:text-red-400 shrink-0 ml-0.5"
                                  >
                                    ✕
                                  </button>
                                )}
                              </span>
                            ))}
                            {!inputsDisabled && (
                              <input
                                type="text"
                                placeholder="+ alternate"
                                className="text-xs border border-dashed border-gray-200 rounded px-1.5 py-0.5 w-28 focus:outline-none focus:ring-1 focus:ring-choco-primary"
                                list="ingredient-suggestions"
                                onBlur={(e): void => {
                                  handleAddCoating(e.target.value);
                                  e.target.value = '';
                                }}
                                onKeyDown={(e): void => {
                                  if (e.key === 'Enter') {
                                    handleAddCoating((e.target as HTMLInputElement).value);
                                    (e.target as HTMLInputElement).value = '';
                                  }
                                }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {!inputsDisabled && !preferred && (
                      <input
                        type="text"
                        placeholder="Add coating ingredient…"
                        className="text-xs border border-dashed border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-choco-primary"
                        list="ingredient-suggestions"
                        onBlur={(e): void => {
                          handleAddCoating(e.target.value);
                          e.target.value = '';
                        }}
                        onKeyDown={(e): void => {
                          if (e.key === 'Enter') {
                            handleAddCoating((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                    )}
                  </div>
                </EditSection>
              );
            })()}

          <datalist id="ingredient-suggestions">
            {ingredientSuggestions.map((s) => (
              <option key={s.id} value={s.name} />
            ))}
          </datalist>

          {/* Procedures — preferred primary + alternates chips */}
          <EditSection title="Procedures">
            {(() => {
              const procs = currentVariation.procedures;
              const preferred = procs?.preferredId;
              const preferredOpt = procs?.options.find((o) => o.id === preferred);
              const alternates = procs?.options.filter((o) => o.id !== preferred) ?? [];
              return (
                <div className="space-y-1.5">
                  {preferredOpt && (
                    <div className="rounded border border-gray-200 p-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-800">
                          {procedureSuggestions.find((s) => s.id === preferredOpt.id)?.name ??
                            preferredOpt.id}
                        </span>
                        {!inputsDisabled && (
                          <button
                            type="button"
                            onClick={(): void => handleRemoveProcedure(preferredOpt.id as ProcedureId)}
                            className="text-xs text-gray-400 hover:text-red-500"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      {(alternates.length > 0 || !inputsDisabled) && (
                        <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-gray-100">
                          <span className="text-xs text-gray-400 shrink-0">also:</span>
                          {alternates.map((opt) => (
                            <span
                              key={opt.id}
                              className="inline-flex items-center gap-0.5 text-xs rounded px-1.5 py-0.5 bg-gray-100 text-gray-600"
                            >
                              {!inputsDisabled && (
                                <button
                                  type="button"
                                  title="Set as preferred"
                                  onClick={(): void => handleSetPreferredProcedure(opt.id as ProcedureId)}
                                  className="text-gray-300 hover:text-amber-400 shrink-0"
                                >
                                  ★
                                </button>
                              )}
                              <span>{procedureSuggestions.find((s) => s.id === opt.id)?.name ?? opt.id}</span>
                              {!inputsDisabled && (
                                <button
                                  type="button"
                                  title="Remove alternate"
                                  onClick={(): void => handleRemoveProcedure(opt.id as ProcedureId)}
                                  className="text-gray-300 hover:text-red-400 shrink-0 ml-0.5"
                                >
                                  ✕
                                </button>
                              )}
                            </span>
                          ))}
                          {!inputsDisabled && (
                            <input
                              type="text"
                              placeholder="+ alternate"
                              className="text-xs border border-dashed border-gray-200 rounded px-1.5 py-0.5 w-28 focus:outline-none focus:ring-1 focus:ring-choco-primary"
                              list="procedure-suggestions"
                              onBlur={(e): void => {
                                handleAddProcedure(e.target.value);
                                e.target.value = '';
                              }}
                              onKeyDown={(e): void => {
                                if (e.key === 'Enter') {
                                  handleAddProcedure((e.target as HTMLInputElement).value);
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {!inputsDisabled && !preferredOpt && (
                    <input
                      type="text"
                      placeholder="Add procedure by name…"
                      className="text-xs border border-dashed border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-choco-primary"
                      list="procedure-suggestions"
                      onBlur={(e): void => {
                        handleAddProcedure(e.target.value);
                        e.target.value = '';
                      }}
                      onKeyDown={(e): void => {
                        if (e.key === 'Enter') {
                          handleAddProcedure((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                  )}
                </div>
              );
            })()}
            <datalist id="procedure-suggestions">
              {procedureSuggestions.map((s) => (
                <option key={s.id} value={s.name} />
              ))}
            </datalist>
          </EditSection>

          {/* Decorations — preferred primary + alternates chips */}
          {(currentVariation.decorations || !inputsDisabled) && (
            <EditSection title="Decorations">
              {(() => {
                const decs = currentVariation.decorations;
                const preferred = decs?.preferredId;
                const preferredOpt = decs?.options.find((o) => o.id === preferred);
                const alternates = decs?.options.filter((o) => o.id !== preferred) ?? [];
                return (
                  <div className="space-y-1.5">
                    {preferredOpt && (
                      <div className="rounded border border-gray-200 p-2 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-800">
                            {decorationSuggestions.find((s) => s.id === preferredOpt.id)?.name ??
                              preferredOpt.id}
                          </span>
                          {!inputsDisabled && (
                            <button
                              type="button"
                              onClick={(): void => handleRemoveDecoration(preferredOpt.id as DecorationId)}
                              className="text-xs text-gray-400 hover:text-red-500"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        {(alternates.length > 0 || !inputsDisabled) && (
                          <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-gray-100">
                            <span className="text-xs text-gray-400 shrink-0">also:</span>
                            {alternates.map((opt) => (
                              <span
                                key={opt.id}
                                className="inline-flex items-center gap-0.5 text-xs rounded px-1.5 py-0.5 bg-gray-100 text-gray-600"
                              >
                                {!inputsDisabled && (
                                  <button
                                    type="button"
                                    title="Set as preferred"
                                    onClick={(): void => handleSetPreferredDecoration(opt.id as DecorationId)}
                                    className="text-gray-300 hover:text-amber-400 shrink-0"
                                  >
                                    ★
                                  </button>
                                )}
                                <span>
                                  {decorationSuggestions.find((s) => s.id === opt.id)?.name ?? opt.id}
                                </span>
                                {!inputsDisabled && (
                                  <button
                                    type="button"
                                    title="Remove alternate"
                                    onClick={(): void => handleRemoveDecoration(opt.id as DecorationId)}
                                    className="text-gray-300 hover:text-red-400 shrink-0 ml-0.5"
                                  >
                                    ✕
                                  </button>
                                )}
                              </span>
                            ))}
                            {!inputsDisabled && (
                              <input
                                type="text"
                                placeholder="+ alternate"
                                className="text-xs border border-dashed border-gray-200 rounded px-1.5 py-0.5 w-28 focus:outline-none focus:ring-1 focus:ring-choco-primary"
                                list="decoration-suggestions"
                                onBlur={(e): void => {
                                  handleAddDecoration(e.target.value);
                                  e.target.value = '';
                                }}
                                onKeyDown={(e): void => {
                                  if (e.key === 'Enter') {
                                    handleAddDecoration((e.target as HTMLInputElement).value);
                                    (e.target as HTMLInputElement).value = '';
                                  }
                                }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {!inputsDisabled && !preferredOpt && (
                      <input
                        type="text"
                        placeholder="Add decoration…"
                        className="text-xs border border-dashed border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-choco-primary"
                        list="decoration-suggestions"
                        onBlur={(e): void => {
                          handleAddDecoration(e.target.value);
                          e.target.value = '';
                        }}
                        onKeyDown={(e): void => {
                          if (e.key === 'Enter') {
                            handleAddDecoration((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                    )}
                    <datalist id="decoration-suggestions">
                      {decorationSuggestions.map((s) => (
                        <option key={s.id} value={s.name} />
                      ))}
                    </datalist>
                  </div>
                );
              })()}
            </EditSection>
          )}

          {/* Notes */}
          <NotesEditor value={currentVariation.notes} onChange={handleNotesChange} />
        </>
      )}
    </div>
  );
}
