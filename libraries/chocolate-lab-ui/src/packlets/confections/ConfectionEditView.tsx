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

import React, { useCallback, useMemo } from 'react';
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
  ProcedureId
} from '@fgv/ts-chocolate';
import { Entities as EntitiesNS, LibraryRuntime as LR } from '@fgv/ts-chocolate';

import { EditingToolbar, NotesEditor, useEditingContext, type IChangeIndicator } from '../editing';
import { DerivedFromIndicator } from '../common';
import { useWorkspace } from '../workspace';
import { PreferredWithAlternatesEditor } from './PreferredWithAlternatesEditor';
import { FillingsEditor } from './FillingsEditor';
import { VariationChips } from './VariationChips';

type EditedConfectionRecipe = LibraryRuntime.EditedConfectionRecipe;

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
  readonly onFillingClick?: (
    id: FillingId,
    targetWeight?: number,
    sourceConfectionId?: string,
    sourceSlotId?: string
  ) => void;
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
    },
    [wrapper, notifyWrapper]
  );

  const handleCreateBlankVariation = useCallback(
    (date: string | undefined, name: string | undefined): void => {
      const result = wrapper.createBlankVariation({ date, name });
      if (result.isSuccess()) {
        notifyWrapper();
        onVariationChange(result.value);
      }
    },
    [wrapper, notifyWrapper, onVariationChange]
  );

  const handleDuplicateVariation = useCallback(
    (date: string | undefined, name: string | undefined): void => {
      const result = wrapper.duplicateVariation(selectedVariationSpec, { date, name });
      if (result.isSuccess()) {
        notifyWrapper();
        onVariationChange(result.value);
      }
    },
    [wrapper, selectedVariationSpec, notifyWrapper, onVariationChange]
  );

  // ============================================================================
  // Variation-Level Data
  // ============================================================================

  const currentVariation = useMemo(
    () => wrapper.variations.find((v) => v.variationSpec === selectedVariationSpec),
    [wrapper.variations, selectedVariationSpec, ctx.version]
  );

  // ---- Default-scale slot weights from current (draft) yield ----
  // Uses the entity yield from the wrapper (reflects unsaved edits) as the
  // scaling target, but the runtime variation for filling composition.
  const defaultSlotWeights = useMemo((): Readonly<Record<string, number>> | undefined => {
    if (!currentVariation) return undefined;
    const runtimeVariation = confection.getVariation(selectedVariationSpec);
    if (runtimeVariation.isFailure()) return undefined;
    const entityYield = currentVariation.yield;
    const target: LR.IConfectionScalingTarget = EntitiesNS.Confections.isYieldInFrames(entityYield)
      ? { targetFrames: entityYield.numFrames }
      : { targetCount: entityYield.numPieces };
    if (!LR.canScale(runtimeVariation.value, target)) return undefined;
    const result = LR.computeScaledFillings(runtimeVariation.value, target);
    if (!result.isSuccess()) return undefined;
    const weights: Record<string, number> = {};
    for (const slot of result.value.slots) {
      weights[slot.slotId] = slot.targetWeight;
    }
    return weights;
  }, [confection, selectedVariationSpec, currentVariation]);

  const ingredientSuggestions = useMemo(
    () => availableIngredients.map((i) => ({ id: i.id, name: i.name })),
    [availableIngredients]
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
  const procedureMatcher = useTypeaheadMatch(procedureSuggestions);
  const moldMatcher = useTypeaheadMatch(moldSuggestions);
  const decorationMatcher = useTypeaheadMatch(decorationSuggestions);

  // ============================================================================
  // Variation-Level Handlers
  // ============================================================================

  const handleYieldCountChange = useCallback(
    (value: string): void => {
      if (!currentVariation) return;
      const count = parseInt(value, 10);
      if (!isNaN(count) && count > 0) {
        const yieldSpec = EntitiesNS.Confections.isMoldedBonBonRecipeVariationEntity(currentVariation)
          ? ({ ...currentVariation.yield, numFrames: count } as Entities.Confections.IYieldInFrames)
          : ({ ...currentVariation.yield, numPieces: count } as Entities.Confections.IYieldInPieces);
        wrapper.setVariationYield(selectedVariationSpec, yieldSpec);
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

  const handleFillingsChange = useCallback(
    (fillings: ReadonlyArray<Entities.Confections.IFillingSlotEntity> | undefined): void => {
      wrapper.setVariationFillings(selectedVariationSpec, fillings);
      notifyWrapper();
    },
    [wrapper, selectedVariationSpec, notifyWrapper]
  );

  // ---- Procedure handlers ----

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

  const handleSetPreferredProcedure = useCallback(
    (procId: ProcedureId): void => {
      const current = currentVariation?.procedures;
      if (!current) return;
      wrapper.setVariationProcedures(selectedVariationSpec, { ...current, preferredId: procId });
      notifyWrapper();
    },
    [wrapper, selectedVariationSpec, currentVariation, notifyWrapper]
  );

  // ---- Enrobing chocolate handlers ----

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

  // ---- Coating handlers (rolled truffle) ----

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

  // ---- Shell chocolate handlers (molded bon-bon) ----

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

  // ---- Additional chocolates handlers (molded bon-bon) ----

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

  // ---- Decoration handlers ----

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

  // ---- Mold handlers (molded bon-bon) ----

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
  // Confection-type flags
  // ============================================================================

  const isMoldedBonBon =
    currentVariation !== undefined &&
    EntitiesNS.Confections.isMoldedBonBonRecipeVariationEntity(currentVariation);
  const isRolledTruffle =
    currentVariation !== undefined &&
    EntitiesNS.Confections.isRolledTruffleRecipeVariationEntity(currentVariation);
  const isBarTruffle =
    currentVariation !== undefined &&
    EntitiesNS.Confections.isBarTruffleRecipeVariationEntity(currentVariation);

  // ============================================================================
  // Computed display-name resolvers for PreferredWithAlternatesEditor
  // ============================================================================

  const getIngredientName = useCallback(
    (id: string): string => ingredientSuggestions.find((s) => s.id === id)?.name ?? id,
    [ingredientSuggestions]
  );

  const getMoldName = useCallback(
    (id: string): string => moldSuggestions.find((s) => s.id === id)?.name ?? id,
    [moldSuggestions]
  );

  const getProcedureName = useCallback(
    (id: string): string => procedureSuggestions.find((s) => s.id === id)?.name ?? id,
    [procedureSuggestions]
  );

  const getDecorationName = useCallback(
    (id: string): string => decorationSuggestions.find((s) => s.id === id)?.name ?? id,
    [decorationSuggestions]
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
  // Mold/Shell/Additional chocolate section data (molded bon-bon)
  // ============================================================================

  const moldData = useMemo(() => {
    if (!isMoldedBonBon) return undefined;
    const v = currentVariation as Entities.Confections.IMoldedBonBonRecipeVariationEntity;
    const preferred = v.molds.options.find((o) => o.id === v.molds.preferredId) ?? v.molds.options[0];
    return {
      preferredId: preferred?.id as MoldId | undefined,
      alternateIds: v.molds.options.filter((o) => o.id !== preferred?.id).map((o) => o.id as MoldId)
    };
  }, [isMoldedBonBon, currentVariation]);

  const shellData = useMemo(() => {
    if (!isMoldedBonBon) return undefined;
    const v = currentVariation as Entities.Confections.IMoldedBonBonRecipeVariationEntity;
    return {
      preferredId: v.shellChocolate.preferredId as IngredientId | undefined,
      alternateIds: v.shellChocolate.ids.filter((id) => id !== v.shellChocolate.preferredId) as IngredientId[]
    };
  }, [isMoldedBonBon, currentVariation]);

  const enrobingData = useMemo(() => {
    if (!isRolledTruffle && !isBarTruffle) return undefined;
    const v = currentVariation as
      | Entities.Confections.IRolledTruffleRecipeVariationEntity
      | Entities.Confections.IBarTruffleRecipeVariationEntity;
    const ec = v.enrobingChocolate;
    return {
      preferredId: ec?.preferredId as IngredientId | undefined,
      alternateIds: ec ? (ec.ids.filter((id) => id !== ec.preferredId) as IngredientId[]) : []
    };
  }, [isRolledTruffle, isBarTruffle, currentVariation]);

  const coatingData = useMemo(() => {
    if (!isRolledTruffle) return undefined;
    const v = currentVariation as Entities.Confections.IRolledTruffleRecipeVariationEntity;
    return {
      preferredId: v.coatings?.preferredId as IngredientId | undefined,
      alternateIds: (v.coatings?.ids ?? []).filter((id) => id !== v.coatings?.preferredId) as IngredientId[]
    };
  }, [isRolledTruffle, currentVariation]);

  const procedureData = useMemo(() => {
    const procs = currentVariation?.procedures;
    const preferred = procs?.options.find((o) => o.id === procs?.preferredId);
    return {
      preferredId: preferred?.id as ProcedureId | undefined,
      alternateIds: (procs?.options.filter((o) => o.id !== preferred?.id) ?? []).map(
        (o) => o.id as ProcedureId
      )
    };
  }, [currentVariation]);

  const decorationData = useMemo(() => {
    const decs = currentVariation?.decorations;
    const preferred = decs?.options.find((o) => o.id === decs?.preferredId);
    return {
      preferredId: preferred?.id as DecorationId | undefined,
      alternateIds: (decs?.options.filter((o) => o.id !== preferred?.id) ?? []).map(
        (o) => o.id as DecorationId
      )
    };
  }, [currentVariation]);

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
        <VariationChips
          wrapper={wrapper}
          selectedVariationSpec={selectedVariationSpec}
          disabled={inputsDisabled}
          onVariationChange={onVariationChange}
          onSetGolden={handleSetGoldenVariation}
          onRemove={handleRemoveVariation}
          onRename={handleCommitVariationName}
          onCreateBlank={handleCreateBlankVariation}
          onDuplicate={handleDuplicateVariation}
        />
      )}

      {/* Variation Detail — editable sections */}
      {currentVariation && (
        <>
          {/* Yield */}
          <EditSection title="Default Yield">
            <EditField
              label={EntitiesNS.Confections.isYieldInFrames(currentVariation.yield) ? 'Frames' : 'Count'}
            >
              <input
                type="number"
                min={1}
                className="text-sm border border-gray-300 rounded px-2 py-1 w-24 focus:outline-none focus:ring-1 focus:ring-choco-primary"
                value={
                  EntitiesNS.Confections.isYieldInFrames(currentVariation.yield)
                    ? currentVariation.yield.numFrames
                    : currentVariation.yield.numPieces
                }
                onChange={(e): void => handleYieldCountChange(e.target.value)}
                disabled={inputsDisabled}
              />
            </EditField>
          </EditSection>

          {/* Molds (molded bon-bon only) */}
          {isMoldedBonBon && moldData && (
            <PreferredWithAlternatesEditor<MoldId>
              title="Mold"
              preferredId={moldData.preferredId}
              alternateIds={moldData.alternateIds}
              getDisplayName={getMoldName}
              disabled={inputsDisabled}
              datalistId="mold-suggestions"
              changePlaceholder="Change mold…"
              addPlaceholder="+ alternate"
              onChangePreferred={(input): void => {
                const m = moldMatcher.resolveOnBlur(input);
                if (m) handleSetPreferredMold(m.id as MoldId);
                else if (input.trim()) onAddMold?.(input.trim());
              }}
              onSetPreferred={(id): void => handleSetPreferredMold(id)}
              onRemove={(id): void => handleRemoveMold(id)}
              onAddAlternate={(input): void => handleAddMold(input)}
            />
          )}

          {/* Shell Chocolate (molded bon-bon only) */}
          {isMoldedBonBon && shellData && (
            <PreferredWithAlternatesEditor<IngredientId>
              title="Shell Chocolate"
              preferredId={shellData.preferredId}
              alternateIds={shellData.alternateIds}
              getDisplayName={getIngredientName}
              disabled={inputsDisabled}
              datalistId="ingredient-suggestions"
              changePlaceholder="Change chocolate…"
              addPlaceholder="+ alternate"
              onChangePreferred={(input): void => handleSetShellChocolate(input)}
              onSetPreferred={(id): void => handleSetPreferredShellChocolate(id)}
              onRemove={(id): void => handleRemoveShellChocolate(id)}
              onAddAlternate={(input): void => handleAddShellChocolateAlternate(input)}
            />
          )}

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
                              {getIngredientName(preferredId ?? '—')}
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

          {/* Fillings */}
          <FillingsEditor
            fillings={currentVariation.fillings}
            disabled={inputsDisabled}
            defaultSlotWeights={defaultSlotWeights}
            confectionId={confection.id}
            availableFillings={availableFillings}
            availableIngredients={availableIngredients}
            onFillingsChange={handleFillingsChange}
            onFillingClick={onFillingClick}
            onAddFilling={onAddFilling}
            onAddIngredient={onAddIngredient}
          />

          {/* Enrobing Chocolate (rolled truffle + bar truffle) */}
          {(isRolledTruffle || isBarTruffle) && enrobingData && (
            <PreferredWithAlternatesEditor<IngredientId>
              title="Enrobing Chocolate"
              preferredId={enrobingData.preferredId}
              alternateIds={enrobingData.alternateIds}
              getDisplayName={getIngredientName}
              disabled={inputsDisabled}
              datalistId="ingredient-suggestions"
              changePlaceholder="Set enrobing chocolate…"
              addPlaceholder="+ alternate"
              onChangePreferred={(input): void => handleSetEnrobingChocolate(input)}
              onRemove={(): void => handleClearEnrobingChocolate()}
              onAddAlternate={(input): void => handleSetEnrobingChocolate(input)}
              showClear
              onClear={handleClearEnrobingChocolate}
            />
          )}

          {/* Coatings (rolled truffle only) */}
          {isRolledTruffle && coatingData && (
            <PreferredWithAlternatesEditor<IngredientId>
              title="Coatings"
              preferredId={coatingData.preferredId}
              alternateIds={coatingData.alternateIds}
              getDisplayName={getIngredientName}
              disabled={inputsDisabled}
              datalistId="ingredient-suggestions"
              changePlaceholder="Add coating ingredient…"
              addPlaceholder="+ alternate"
              onChangePreferred={(input): void => handleAddCoating(input)}
              onRemove={(id): void => handleRemoveCoating(id)}
              onAddAlternate={(input): void => handleAddCoating(input)}
            />
          )}

          {/* Datalists */}
          <datalist id="ingredient-suggestions">
            {ingredientSuggestions.map((s) => (
              <option key={s.id} value={s.name} />
            ))}
          </datalist>
          <datalist id="mold-suggestions">
            {moldSuggestions.map((s) => (
              <option key={s.id} value={s.name} />
            ))}
          </datalist>

          {/* Procedures */}
          <PreferredWithAlternatesEditor<ProcedureId>
            title="Procedures"
            preferredId={procedureData.preferredId}
            alternateIds={procedureData.alternateIds}
            getDisplayName={getProcedureName}
            disabled={inputsDisabled}
            datalistId="procedure-suggestions"
            changePlaceholder="Add procedure by name…"
            addPlaceholder="+ alternate"
            onChangePreferred={(input): void => handleAddProcedure(input)}
            onSetPreferred={(id): void => handleSetPreferredProcedure(id)}
            onRemove={(id): void => handleRemoveProcedure(id)}
            onAddAlternate={(input): void => handleAddProcedure(input)}
          />
          <datalist id="procedure-suggestions">
            {procedureSuggestions.map((s) => (
              <option key={s.id} value={s.name} />
            ))}
          </datalist>

          {/* Decorations */}
          {(currentVariation.decorations || !inputsDisabled) && (
            <>
              <PreferredWithAlternatesEditor<DecorationId>
                title="Decorations"
                preferredId={decorationData.preferredId}
                alternateIds={decorationData.alternateIds}
                getDisplayName={getDecorationName}
                disabled={inputsDisabled}
                datalistId="decoration-suggestions"
                changePlaceholder="Add decoration…"
                addPlaceholder="+ alternate"
                onChangePreferred={(input): void => handleAddDecoration(input)}
                onSetPreferred={(id): void => handleSetPreferredDecoration(id)}
                onRemove={(id): void => handleRemoveDecoration(id)}
                onAddAlternate={(input): void => handleAddDecoration(input)}
              />
              <datalist id="decoration-suggestions">
                {decorationSuggestions.map((s) => (
                  <option key={s.id} value={s.name} />
                ))}
              </datalist>
            </>
          )}

          {/* Notes */}
          <NotesEditor value={currentVariation.notes} onChange={handleNotesChange} />
        </>
      )}
    </div>
  );
}
