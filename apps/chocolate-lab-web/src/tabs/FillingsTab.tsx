import React, { useCallback, useMemo, useRef, useState } from 'react';
import { EntityList, type ICascadeColumn, EntityTabLayout, type IComparisonColumn } from '@fgv/ts-app-shell';
import { AiAssist, Editing, Entities, Helpers, LibraryRuntime, UserLibrary } from '@fgv/ts-chocolate';
import type {
  BaseFillingId,
  BaseIngredientId,
  BaseProcedureId,
  CollectionId,
  FillingId,
  FillingRecipeVariationSpec,
  IngredientId,
  TaskId,
  ProcedureId
} from '@fgv/ts-chocolate';
import {
  type ICascadeEntry,
  type FillingSaveMode,
  useTabNavigation,
  useEntityList,
  useMutableCollection,
  IngredientDetail,
  IngredientEditView,
  FillingDetail,
  FillingEditView,
  FillingPreviewPanel,
  ProcedureDetail,
  ProcedureEditView,
  TaskDetail,
  EntityCreateForm,
  useFilteredEntities,
  useProcedureEditSession
} from '@fgv/chocolate-lab-ui';

import {
  FILLING_DESCRIPTOR,
  FILLING_FILTER_SPEC,
  slugify,
  createBlankIngredientEntity,
  createBlankRawProcedureEntity,
  createBlankFillingRecipeEntity
} from '../shared';

interface IFillingEditingState {
  readonly id: string;
  readonly wrapper: LibraryRuntime.EditedFillingRecipe;
  session: UserLibrary.Session.EditingSession;
  selectedVariationSpec: FillingRecipeVariationSpec;
}

export function FillingsTabContent(): React.ReactElement {
  const {
    workspace,
    reactiveWorkspace,
    squashCascade,
    popCascadeTo,
    cascadeStack,
    listCollapsed,
    collapseList,
    compareMode,
    compareIds,
    toggleCompareMode,
    toggleCompareId,
    showingComparison,
    startComparison,
    exitComparison
  } = useTabNavigation();
  const [variationCompare, setVariationCompare] = useState<
    { id: FillingId; specs: ReadonlyArray<string> } | undefined
  >(undefined);
  const [targetYieldMap, setTargetYieldMap] = useState<Map<string, number>>(() => new Map());

  const handleTargetYieldChange = useCallback((fillingId: string, grams: number | undefined): void => {
    setTargetYieldMap((prev) => {
      const next = new Map(prev);
      if (grams === undefined) {
        next.delete(fillingId);
      } else {
        next.set(fillingId, grams);
      }
      return next;
    });
  }, []);

  const editingRef = useRef<IFillingEditingState | undefined>(undefined);
  const editVariationSpecRef = useRef<FillingRecipeVariationSpec | undefined>(undefined);
  const viewVariationSpecRef = useRef<FillingRecipeVariationSpec | undefined>(undefined);
  const subIngredientRef = useRef<{ id: string; wrapper: LibraryRuntime.EditedIngredient } | undefined>(
    undefined
  );
  const subProcedureRef = useRef<{ id: string; wrapper: LibraryRuntime.EditedProcedure } | undefined>(
    undefined
  );
  const [subEntitySeed, setSubEntitySeed] = useState('');

  const mutableCollectionId = useMutableCollection(workspace.data.entities.fillings.collections, [
    workspace,
    reactiveWorkspace.version
  ]);

  const { entities: fillings, selectedId } = useEntityList<LibraryRuntime.FillingRecipe, FillingId>({
    getAll: () => workspace.data.fillings.values(),
    compare: (a, b) => a.name.localeCompare(b.name),
    entityType: 'filling',
    cascadeStack,
    deps: [workspace, reactiveWorkspace.version]
  });

  const availableIngredients = useMemo<ReadonlyArray<LibraryRuntime.AnyIngredient>>(() => {
    return Array.from(workspace.data.ingredients.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [workspace, reactiveWorkspace.version]);

  const availableProcedures = useMemo<ReadonlyArray<LibraryRuntime.IProcedure>>(() => {
    return Array.from(workspace.data.procedures.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [workspace, reactiveWorkspace.version]);

  const availableTasks = useMemo<ReadonlyArray<LibraryRuntime.ITask>>(() => {
    return Array.from(workspace.data.tasks.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [workspace, reactiveWorkspace.version]);

  const procedureSession = useProcedureEditSession({
    procedureRef: subProcedureRef,
    availableTasks,
    cascadeStack,
    squashCascade,
    slugify,
    onMutate: undefined
  });

  const handleSelect = useCallback(
    (id: FillingId): void => {
      const entry: ICascadeEntry = { entityType: 'filling', entityId: id, mode: 'view' };
      squashCascade([entry]);
    },
    [squashCascade]
  );

  const squashAt = useCallback(
    (depth: number, entry: ICascadeEntry): void => {
      squashCascade([...cascadeStack.slice(0, depth + 1), entry]);
    },
    [squashCascade, cascadeStack]
  );

  // ============================================================================
  // Editing State Management
  // ============================================================================

  const getOrCreateEditingState = useCallback(
    (
      filling: LibraryRuntime.FillingRecipe,
      preferredSpec?: FillingRecipeVariationSpec
    ): IFillingEditingState | undefined => {
      const id = filling.id;
      if (editingRef.current?.id === id) {
        return editingRef.current;
      }

      // Create wrapper from entity
      const wrapperResult = LibraryRuntime.EditedFillingRecipe.create(filling.entity);
      if (wrapperResult.isFailure()) {
        workspace.data.logger.error(`Failed to create filling wrapper: ${wrapperResult.message}`);
        return undefined;
      }

      // Create session from preferred variation (or golden if not specified)
      const targetSpec = preferredSpec ?? filling.goldenVariationSpec;
      const variationResult = filling.getVariation(targetSpec);
      if (variationResult.isFailure()) {
        workspace.data.logger.error(`Failed to get variation '${targetSpec}': ${variationResult.message}`);
        return undefined;
      }

      const sessionResult = UserLibrary.Session.EditingSession.create(variationResult.value);
      if (sessionResult.isFailure()) {
        workspace.data.logger.error(`Failed to create editing session: ${sessionResult.message}`);
        return undefined;
      }

      const state: IFillingEditingState = {
        id,
        wrapper: wrapperResult.value,
        session: sessionResult.value,
        selectedVariationSpec: targetSpec
      };
      editingRef.current = state;
      return state;
    },
    [workspace]
  );

  const handleVariationChange = useCallback(
    (spec: FillingRecipeVariationSpec): void => {
      const state = editingRef.current;
      if (!state) return;

      // Try the runtime filling first; fall back to the wrapper's current entity
      // (needed when a new variation was just added to the wrapper but not yet saved)
      const fillingResult = workspace.data.fillings.get(state.id as FillingId);
      if (fillingResult.isFailure()) return;

      const filling = fillingResult.value;
      const fromRuntime = filling.getVariation(spec);
      const variationResult = fromRuntime.isSuccess()
        ? fromRuntime
        : (() => {
            const entity = state.wrapper.current.variations.find((v) => v.variationSpec === spec);
            return entity ? filling.getVariationFromEntity(entity) : fromRuntime;
          })();

      if (variationResult.isFailure()) {
        workspace.data.logger.error(`Failed to switch to variation '${spec}': ${variationResult.message}`);
        return;
      }

      const sessionResult = UserLibrary.Session.EditingSession.create(variationResult.value);
      if (sessionResult.isFailure()) {
        workspace.data.logger.error(
          `Failed to create session for variation '${spec}': ${sessionResult.message}`
        );
        return;
      }

      state.session = sessionResult.value;
      state.selectedVariationSpec = spec;
    },
    [workspace]
  );

  // ============================================================================
  // Edit / Cancel / Save
  // ============================================================================

  const handleEditFilling = useCallback(
    (entityId: string, variationSpec?: FillingRecipeVariationSpec): void => {
      const idx = cascadeStack.findIndex((e) => e.entityId === entityId && e.entityType === 'filling');
      if (idx < 0) return;
      editVariationSpecRef.current = variationSpec;
      squashCascade([...cascadeStack.slice(0, idx), { ...cascadeStack[idx], mode: 'edit' as const }]);
    },
    [cascadeStack, squashCascade]
  );

  const handlePreviewFilling = useCallback(
    (entityId: string): void => {
      const idx = cascadeStack.findIndex((e) => e.entityId === entityId && e.entityType === 'filling');
      if (idx < 0) return;
      squashCascade([
        ...cascadeStack.slice(0, idx + 1),
        { entityType: 'filling', entityId, mode: 'preview' }
      ]);
    },
    [cascadeStack, squashCascade]
  );

  const handleCloseFillingPreview = useCallback(
    (entityId: string): void => {
      squashCascade(
        cascadeStack.filter(
          (e) => !(e.entityType === 'filling' && e.entityId === entityId && e.mode === 'preview')
        )
      );
    },
    [cascadeStack, squashCascade]
  );

  const handleCancelFillingEdit = useCallback(
    (entityId: string): void => {
      if (editingRef.current?.id === entityId) {
        editingRef.current = undefined;
      }
      subIngredientRef.current = undefined;
      subProcedureRef.current = undefined;
      procedureSession.cleanup();
      const updated = cascadeStack.map((e) =>
        e.entityId === entityId && e.entityType === 'filling' ? { ...e, mode: 'view' as const } : e
      );
      squashCascade(updated);
    },
    [cascadeStack, squashCascade, procedureSession]
  );

  const handleSaveFilling = useCallback(
    (mode: FillingSaveMode): void => {
      const state = editingRef.current;
      if (!state) {
        workspace.data.logger.error('Save failed: no editing state');
        return;
      }

      // Integrate session variation edits back into the wrapper
      const spec = state.selectedVariationSpec;

      if (mode === 'update') {
        // Overwrite the current variation with session edits
        const saveResult = state.session.saveAsNewVariation({ variationSpec: spec });
        if (saveResult.isFailure()) {
          workspace.data.logger.error(`Save failed (session): ${saveResult.message}`);
          return;
        }
        if (saveResult.value.variationEntity) {
          const replaceResult = state.wrapper.replaceVariation(spec, saveResult.value.variationEntity);
          if (replaceResult.isFailure()) {
            workspace.data.logger.error(`Save failed (replace variation): ${replaceResult.message}`);
            return;
          }
        }
      } else if (mode === 'new-variation') {
        // Save session edits as a new variation on the same recipe
        const today = new Date().toISOString().split('T')[0];
        const newSpec = `${today}-${String(state.wrapper.variations.length + 1).padStart(
          2,
          '0'
        )}` as FillingRecipeVariationSpec;
        const saveResult = state.session.saveAsNewVariation({ variationSpec: newSpec });
        if (saveResult.isFailure()) {
          workspace.data.logger.error(`Save failed (session): ${saveResult.message}`);
          return;
        }
        if (saveResult.value.variationEntity) {
          const addResult = state.wrapper.addVariation(saveResult.value.variationEntity);
          if (addResult.isFailure()) {
            workspace.data.logger.error(`Save failed (add variation): ${addResult.message}`);
            return;
          }
        }
      } else if (mode === 'alternatives') {
        // Augment the current variation with alternative ingredient choices
        const saveResult = state.session.saveAsAlternatives({ variationSpec: spec });
        if (saveResult.isFailure()) {
          workspace.data.logger.error(`Save failed (session): ${saveResult.message}`);
          return;
        }
        if (saveResult.value.variationEntity) {
          const replaceResult = state.wrapper.replaceVariation(spec, saveResult.value.variationEntity);
          if (replaceResult.isFailure()) {
            workspace.data.logger.error(`Save failed (replace variation): ${replaceResult.message}`);
            return;
          }
        }
      } else if (mode === 'new-recipe') {
        // Create an entirely new recipe derived from this one
        if (!mutableCollectionId) {
          workspace.data.logger.error('Save failed: no mutable collection available');
          return;
        }
        const originalEntity = state.wrapper.current;
        const today = new Date().toISOString().split('T')[0];
        const newSpec = `${today}-01` as FillingRecipeVariationSpec;
        const newBaseId = `${originalEntity.baseId}-derived-${today}` as BaseFillingId;
        const newCompositeId = `${mutableCollectionId}.${newBaseId}` as FillingId;

        const saveResult = state.session.saveAsNewRecipe({
          newId: newCompositeId,
          variationSpec: newSpec
        });
        if (saveResult.isFailure()) {
          workspace.data.logger.error(`Save failed (session): ${saveResult.message}`);
          return;
        }

        const sourceCompositeId = state.id as FillingId;
        const sourceVariationId = Helpers.createFillingRecipeVariationId(sourceCompositeId, spec);

        const newEntity: Entities.Fillings.IFillingRecipeEntity = {
          baseId: newBaseId,
          name: `${originalEntity.name} (derived)` as typeof originalEntity.name,
          category: originalEntity.category,
          description: originalEntity.description,
          tags: originalEntity.tags,
          urls: originalEntity.urls,
          variations: saveResult.value.variationEntity ? [saveResult.value.variationEntity] : [],
          goldenVariationSpec: newSpec,
          derivedFrom: {
            sourceVariationId,
            derivedDate: today
          }
        };

        // Add to mutable collection
        const colResult = workspace.data.entities.fillings.collections.get(mutableCollectionId);
        if (colResult.isFailure() || !colResult.value.isMutable) {
          workspace.data.logger.error('Save failed: mutable collection unavailable');
          return;
        }
        const setResult = colResult.value.items.set(newBaseId, newEntity);
        if (setResult.isFailure()) {
          workspace.data.logger.error(`Save failed (in-memory): ${setResult.message}`);
          return;
        }

        // Persist to disk
        const editableResult =
          workspace.data.entities.getEditableFillingsRecipeEntityCollection(mutableCollectionId);
        if (editableResult.isSuccess()) {
          const editable = editableResult.value;
          editable.set(newBaseId, newEntity);
          if (editable.canSave()) {
            const diskResult = editable.save();
            if (diskResult.isFailure()) {
              workspace.data.logger.error(`Disk save failed: ${diskResult.message}`);
            } else {
              workspace.data.logger.info(
                `Created new recipe '${newEntity.name}' from '${originalEntity.name}'`
              );
            }
          }
        }

        workspace.data.clearCache();
        reactiveWorkspace.notifyChange();

        // Clean up editing state and navigate to the new recipe
        editingRef.current = undefined;
        subIngredientRef.current = undefined;
        subProcedureRef.current = undefined;
        procedureSession.cleanup();
        squashCascade([{ entityType: 'filling', entityId: newCompositeId, mode: 'view' as const }]);
        return;
      }

      // For update and new-variation: persist the existing recipe entity
      const entity = state.wrapper.current;

      // Validate the entity
      const validationResult = Editing.Fillings.Validators.validateFillingRecipeEntity(entity);
      if (validationResult.isFailure()) {
        workspace.data.logger.error(`Save failed: ${validationResult.message}`);
        return;
      }

      const compositeId = state.id;
      const collectionId = compositeId.split('.')[0] as CollectionId;
      const baseId = entity.baseId as BaseFillingId;

      // Persist to in-memory collection
      const collectionEntry = workspace.data.entities.fillings.collections.get(collectionId);
      if (collectionEntry.isFailure()) {
        workspace.data.logger.error(`Save failed: collection '${collectionId}' not found`);
        return;
      }
      if (!collectionEntry.value.isMutable) {
        workspace.data.logger.error(`Save failed: collection '${collectionId}' is immutable`);
        return;
      }

      const inMemoryResult = collectionEntry.value.items.set(baseId, entity);
      if (inMemoryResult.isFailure()) {
        workspace.data.logger.error(`Save failed (in-memory): ${inMemoryResult.message}`);
        return;
      }

      // Persist to disk
      const editableResult = workspace.data.entities.getEditableFillingsRecipeEntityCollection(collectionId);
      if (editableResult.isSuccess()) {
        const editable = editableResult.value;
        editable.set(baseId, entity);
        if (editable.canSave()) {
          const saveResult = editable.save();
          if (saveResult.isFailure()) {
            workspace.data.logger.error(`Disk save failed: ${saveResult.message}`);
          } else {
            workspace.data.logger.info(
              `Saved filling '${entity.name}' (${mode}) to collection '${collectionId}'`
            );
          }
        } else {
          workspace.data.logger.info(
            `Updated filling '${entity.name}' in-memory (collection '${collectionId}' has no backing file)`
          );
        }
      } else {
        workspace.data.logger.info(
          `Updated filling '${entity.name}' in-memory only: ${editableResult.message}`
        );
      }

      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();

      // Preserve edited variation spec for detail view
      viewVariationSpecRef.current = editingRef.current?.selectedVariationSpec;

      if (editingRef.current?.id === compositeId) {
        editingRef.current = undefined;
      }
      subIngredientRef.current = undefined;
      subProcedureRef.current = undefined;
      procedureSession.cleanup();
      const updated = cascadeStack.map((e) =>
        e.entityId === compositeId && e.entityType === 'filling' ? { ...e, mode: 'view' as const } : e
      );
      squashCascade(updated);
    },
    [workspace, reactiveWorkspace, cascadeStack, squashCascade, procedureSession, mutableCollectionId]
  );

  // ============================================================================
  // Create Flow
  // ============================================================================

  const handleNewFilling = useCallback((): void => {
    const entry: ICascadeEntry = { entityType: 'filling', entityId: '__new__', mode: 'create' };
    squashCascade([entry]);
  }, [squashCascade]);

  const handleCreateFilling = useCallback(
    (entity: Entities.Fillings.IFillingRecipeEntity, source: 'manual' | 'ai'): void => {
      if (!mutableCollectionId) {
        workspace.data.logger.error('Cannot add filling: no mutable collection available');
        return;
      }

      const baseId = entity.baseId as BaseFillingId;
      const compositeId = `${mutableCollectionId}.${baseId}` as FillingId;

      const existing = workspace.data.fillings.get(compositeId);
      if (existing.isSuccess()) {
        workspace.data.logger.error(`Filling '${compositeId}' already exists`);
        return;
      }

      const colResult = workspace.data.entities.fillings.collections.get(mutableCollectionId);
      if (colResult.isFailure()) {
        workspace.data.logger.error(`Collection '${mutableCollectionId}' not found: ${colResult.message}`);
        return;
      }
      if (!colResult.value.isMutable) {
        workspace.data.logger.error(`Collection '${mutableCollectionId}' is not mutable`);
        return;
      }
      const setResult = colResult.value.items.set(baseId, entity);
      if (setResult.isFailure()) {
        workspace.data.logger.error(`Failed to add filling: ${setResult.message}`);
        return;
      }

      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();

      // Create editing state for the new filling
      const wrapperResult = LibraryRuntime.EditedFillingRecipe.create(entity);
      if (wrapperResult.isFailure()) {
        workspace.data.logger.error(`Failed to create editing wrapper: ${wrapperResult.message}`);
        return;
      }

      // Get the runtime filling to create a session
      const fillingResult = workspace.data.fillings.get(compositeId);
      if (fillingResult.isFailure()) {
        workspace.data.logger.error(`Failed to load newly created filling: ${fillingResult.message}`);
        return;
      }

      const goldenSpec = fillingResult.value.goldenVariationSpec;
      const variationResult = fillingResult.value.getVariation(goldenSpec);
      if (variationResult.isFailure()) {
        workspace.data.logger.error(`Failed to get golden variation: ${variationResult.message}`);
        return;
      }

      const sessionResult = UserLibrary.Session.EditingSession.create(variationResult.value);
      if (sessionResult.isFailure()) {
        workspace.data.logger.error(`Failed to create editing session: ${sessionResult.message}`);
        return;
      }

      editingRef.current = {
        id: compositeId,
        wrapper: wrapperResult.value,
        session: sessionResult.value,
        selectedVariationSpec: goldenSpec
      };

      if (source === 'ai') {
        workspace.data.logger.info(`Created filling '${entity.name}' from AI-generated data`);
      }

      const entry: ICascadeEntry = { entityType: 'filling', entityId: compositeId, mode: 'edit' };
      squashCascade([entry]);
    },
    [workspace, reactiveWorkspace, mutableCollectionId, squashCascade]
  );

  const handleCreateFormCancel = useCallback((): void => {
    squashCascade([]);
  }, [squashCascade]);

  // ============================================================================
  // Sub-Entity Creation (Ingredients / Procedures from Filling Editor)
  // ============================================================================

  const handleCreateIngredientFromFilling = useCallback(
    (seed: string): void => {
      const editIdx = cascadeStack.findIndex((e) => e.entityType === 'filling' && e.mode === 'edit');
      if (editIdx < 0) return;
      setSubEntitySeed(seed);
      squashCascade([
        ...cascadeStack.slice(0, editIdx + 1),
        { entityType: 'ingredient', entityId: '__new__', mode: 'create' }
      ]);
    },
    [cascadeStack, squashCascade]
  );

  const handleCreateProcedureFromFilling = useCallback(
    (seed: string): void => {
      const editIdx = cascadeStack.findIndex((e) => e.entityType === 'filling' && e.mode === 'edit');
      if (editIdx < 0) return;
      setSubEntitySeed(seed);
      squashCascade([
        ...cascadeStack.slice(0, editIdx + 1),
        { entityType: 'procedure', entityId: '__new__', mode: 'create' }
      ]);
    },
    [cascadeStack, squashCascade]
  );

  const handleSubEntityIngredientCreate = useCallback(
    (entity: Entities.Ingredients.IngredientEntity, _source: 'manual' | 'ai'): void => {
      let ingredientCollectionId: CollectionId | undefined;
      for (const [id, col] of workspace.data.entities.ingredients.collections.entries()) {
        if (col.isMutable) {
          ingredientCollectionId = id as CollectionId;
          break;
        }
      }
      if (!ingredientCollectionId) {
        workspace.data.logger.error('Cannot add ingredient: no mutable ingredient collection available');
        return;
      }

      const baseId = entity.baseId as BaseIngredientId;
      const compositeId = `${ingredientCollectionId}.${baseId}` as IngredientId;

      const existing = workspace.data.ingredients.get(compositeId);
      if (existing.isSuccess()) {
        workspace.data.logger.error(`Ingredient '${compositeId}' already exists`);
        return;
      }

      const colResult = workspace.data.entities.ingredients.collections.get(ingredientCollectionId);
      if (colResult.isFailure() || !colResult.value.isMutable) {
        workspace.data.logger.error('Failed to access mutable ingredient collection');
        return;
      }
      const setResult = colResult.value.items.set(baseId, entity);
      if (setResult.isFailure()) {
        workspace.data.logger.error(`Failed to add ingredient: ${setResult.message}`);
        return;
      }

      // Persist to disk
      const editableResult =
        workspace.data.entities.getEditableIngredientsEntityCollection(ingredientCollectionId);
      if (editableResult.isSuccess()) {
        const editable = editableResult.value;
        editable.set(baseId, entity);
        if (editable.canSave()) {
          const diskResult = editable.save();
          if (diskResult.isFailure()) {
            workspace.data.logger.error(`Disk save failed for ingredient: ${diskResult.message}`);
          }
        }
      }

      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();
      setSubEntitySeed('');

      // Open the new ingredient in edit mode
      const wrapperResult = LibraryRuntime.EditedIngredient.create(entity);
      if (wrapperResult.isFailure()) {
        workspace.data.logger.error(`Failed to create ingredient editing wrapper: ${wrapperResult.message}`);
        return;
      }
      subIngredientRef.current = { id: compositeId, wrapper: wrapperResult.value };

      const editIdx = cascadeStack.findIndex((e) => e.entityType === 'filling' && e.mode === 'edit');
      if (editIdx >= 0) {
        squashCascade([
          ...cascadeStack.slice(0, editIdx + 1),
          { entityType: 'ingredient', entityId: compositeId, mode: 'edit' }
        ]);
      }
    },
    [workspace, reactiveWorkspace, cascadeStack, squashCascade]
  );

  const handleSubEntityProcedureCreate = useCallback(
    (entity: Entities.Procedures.IProcedureEntity, _source: 'manual' | 'ai'): void => {
      let procedureCollectionId: CollectionId | undefined;
      for (const [id, col] of workspace.data.entities.procedures.collections.entries()) {
        if (col.isMutable) {
          procedureCollectionId = id as CollectionId;
          break;
        }
      }
      if (!procedureCollectionId) {
        workspace.data.logger.error('Cannot add procedure: no mutable procedure collection available');
        return;
      }

      const baseId = entity.baseId as BaseProcedureId;
      const compositeId = `${procedureCollectionId}.${baseId}` as ProcedureId;

      const existing = workspace.data.procedures.get(compositeId);
      if (existing.isSuccess()) {
        workspace.data.logger.error(`Procedure '${compositeId}' already exists`);
        return;
      }

      const colResult = workspace.data.entities.procedures.collections.get(procedureCollectionId);
      if (colResult.isFailure() || !colResult.value.isMutable) {
        workspace.data.logger.error('Failed to access mutable procedure collection');
        return;
      }
      const setResult = colResult.value.items.set(baseId, entity);
      if (setResult.isFailure()) {
        workspace.data.logger.error(`Failed to add procedure: ${setResult.message}`);
        return;
      }

      // Persist to disk
      const editableResult =
        workspace.data.entities.getEditableProceduresEntityCollection(procedureCollectionId);
      if (editableResult.isSuccess()) {
        const editable = editableResult.value;
        editable.set(baseId, entity);
        if (editable.canSave()) {
          const diskResult = editable.save();
          if (diskResult.isFailure()) {
            workspace.data.logger.error(`Disk save failed for procedure: ${diskResult.message}`);
          }
        }
      }

      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();
      setSubEntitySeed('');

      // Open the new procedure in edit mode
      const wrapperResult = LibraryRuntime.EditedProcedure.create(entity);
      if (wrapperResult.isFailure()) {
        workspace.data.logger.error(`Failed to create procedure editing wrapper: ${wrapperResult.message}`);
        return;
      }
      subProcedureRef.current = { id: compositeId, wrapper: wrapperResult.value };

      const editIdx = cascadeStack.findIndex((e) => e.entityType === 'filling' && e.mode === 'edit');
      if (editIdx >= 0) {
        squashCascade([
          ...cascadeStack.slice(0, editIdx + 1),
          { entityType: 'procedure', entityId: compositeId, mode: 'edit' }
        ]);
      }
    },
    [workspace, reactiveWorkspace, cascadeStack, squashCascade]
  );

  const handleSubEntityCancel = useCallback((): void => {
    setSubEntitySeed('');
    const editIdx = cascadeStack.findIndex((e) => e.entityType === 'filling' && e.mode === 'edit');
    if (editIdx >= 0) {
      squashCascade(cascadeStack.slice(0, editIdx + 1));
    } else {
      squashCascade([]);
    }
  }, [cascadeStack, squashCascade]);

  // ============================================================================
  // Sub-Entity Editing (Ingredient / Procedure opened from Filling Editor)
  // ============================================================================

  const getOrCreateSubIngredientWrapper = useCallback(
    (ingredient: LibraryRuntime.AnyIngredient): LibraryRuntime.EditedIngredient | undefined => {
      const id = ingredient.id;
      if (subIngredientRef.current?.id === id) {
        return subIngredientRef.current.wrapper;
      }
      const result = LibraryRuntime.EditedIngredient.create(ingredient.entity);
      if (result.isFailure()) {
        return undefined;
      }
      subIngredientRef.current = { id, wrapper: result.value };
      return result.value;
    },
    []
  );

  const getOrCreateSubProcedureWrapper = useCallback(
    (procedure: LibraryRuntime.IProcedure): LibraryRuntime.EditedProcedure | undefined => {
      const id = procedure.id;
      if (subProcedureRef.current?.id === id) {
        return subProcedureRef.current.wrapper;
      }
      const result = LibraryRuntime.EditedProcedure.create(procedure.entity);
      if (result.isFailure()) {
        return undefined;
      }
      subProcedureRef.current = { id, wrapper: result.value };
      return result.value;
    },
    []
  );

  const handleSubIngredientSave = useCallback(
    (wrapper: LibraryRuntime.EditedIngredient): void => {
      const entity = wrapper.current;
      const compositeId = subIngredientRef.current?.id;
      if (!compositeId) return;

      const collectionId = compositeId.split('.')[0] as CollectionId;
      const baseId = entity.baseId as BaseIngredientId;

      const colResult = workspace.data.entities.ingredients.collections.get(collectionId);
      if (colResult.isFailure() || !colResult.value.isMutable) {
        workspace.data.logger.error(`Save failed: ingredient collection '${collectionId}' not available`);
        return;
      }
      colResult.value.items.set(baseId, entity);

      const editableResult = workspace.data.entities.getEditableIngredientsEntityCollection(collectionId);
      if (editableResult.isSuccess()) {
        const editable = editableResult.value;
        editable.set(baseId, entity);
        if (editable.canSave()) {
          const diskResult = editable.save();
          if (diskResult.isFailure()) {
            workspace.data.logger.error(`Disk save failed for ingredient: ${diskResult.message}`);
          }
        }
      }

      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();
      subIngredientRef.current = undefined;

      const editIdx = cascadeStack.findIndex((e) => e.entityType === 'filling' && e.mode === 'edit');
      if (editIdx >= 0) {
        squashCascade(cascadeStack.slice(0, editIdx + 1));
      }
    },
    [workspace, reactiveWorkspace, cascadeStack, squashCascade]
  );

  const handleSubIngredientCancel = useCallback((): void => {
    subIngredientRef.current = undefined;
    const editIdx = cascadeStack.findIndex((e) => e.entityType === 'filling' && e.mode === 'edit');
    if (editIdx >= 0) {
      squashCascade(cascadeStack.slice(0, editIdx + 1));
    }
  }, [cascadeStack, squashCascade]);

  const handleSubProcedureSave = useCallback(
    (wrapper: LibraryRuntime.EditedProcedure): void => {
      const entity = wrapper.current;
      const compositeId = subProcedureRef.current?.id;
      if (!compositeId) return;

      const collectionId = compositeId.split('.')[0] as CollectionId;
      const baseId = entity.baseId as BaseProcedureId;

      const colResult = workspace.data.entities.procedures.collections.get(collectionId);
      if (colResult.isFailure() || !colResult.value.isMutable) {
        workspace.data.logger.error(`Save failed: procedure collection '${collectionId}' not available`);
        return;
      }
      colResult.value.items.set(baseId, entity);

      const editableResult = workspace.data.entities.getEditableProceduresEntityCollection(collectionId);
      if (editableResult.isSuccess()) {
        const editable = editableResult.value;
        editable.set(baseId, entity);
        if (editable.canSave()) {
          const diskResult = editable.save();
          if (diskResult.isFailure()) {
            workspace.data.logger.error(`Disk save failed for procedure: ${diskResult.message}`);
          }
        }
      }

      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();
      subProcedureRef.current = undefined;
      procedureSession.cleanup();

      const editIdx = cascadeStack.findIndex((e) => e.entityType === 'filling' && e.mode === 'edit');
      if (editIdx >= 0) {
        squashCascade(cascadeStack.slice(0, editIdx + 1));
      }
    },
    [workspace, reactiveWorkspace, cascadeStack, squashCascade, procedureSession]
  );

  const handleSubProcedureCancel = useCallback((): void => {
    subProcedureRef.current = undefined;
    procedureSession.cleanup();
    const editIdx = cascadeStack.findIndex((e) => e.entityType === 'filling' && e.mode === 'edit');
    if (editIdx >= 0) {
      squashCascade(cascadeStack.slice(0, editIdx + 1));
    }
  }, [cascadeStack, squashCascade, procedureSession]);

  // ============================================================================
  // Cascade Columns
  // ============================================================================

  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascadeStack.map((entry, index) => {
      const onIngredientClick = (id: IngredientId): void => {
        squashAt(index, { entityType: 'ingredient', entityId: id, mode: 'view' });
      };
      const onProcedureClick = (id: ProcedureId): void => {
        squashAt(index, { entityType: 'procedure', entityId: id, mode: 'view' });
      };
      const onTaskClick = (id: TaskId): void => {
        squashAt(index, { entityType: 'task', entityId: id, mode: 'view' });
      };

      if (entry.entityType === 'filling') {
        // Create mode
        if (entry.mode === 'create') {
          return {
            key: '__new__',
            label: 'New Filling',
            content: (
              <EntityCreateForm<Entities.Fillings.IFillingRecipeEntity>
                slugify={slugify}
                buildPrompt={(name: string): string => name}
                convert={(from: unknown) => Entities.Fillings.Converters.fillingRecipeEntity.convert(from)}
                makeBlank={(name: string, id: string): Entities.Fillings.IFillingRecipeEntity =>
                  createBlankFillingRecipeEntity(id as BaseFillingId, name)
                }
                onCreate={handleCreateFilling}
                onCancel={handleCreateFormCancel}
                namePlaceholder="e.g. Dark Chocolate Ganache"
                entityLabel="Filling"
              />
            )
          };
        }

        const result = workspace.data.fillings.get(entry.entityId as FillingId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load filling: {entry.entityId}</div>
          };
        }

        // Edit mode
        if (entry.mode === 'edit') {
          const state = getOrCreateEditingState(result.value, editVariationSpecRef.current);
          editVariationSpecRef.current = undefined;
          if (!state) {
            return {
              key: entry.entityId,
              label: result.value.name,
              content: <div className="p-4 text-red-500">Failed to create editing state</div>
            };
          }
          return {
            key: `${entry.entityId}:edit`,
            label: `Editing: ${result.value.name}`,
            content: (
              <FillingEditView
                wrapper={state.wrapper}
                session={state.session}
                selectedVariationSpec={state.selectedVariationSpec}
                onVariationChange={handleVariationChange}
                availableIngredients={availableIngredients}
                availableProcedures={availableProcedures}
                onSave={handleSaveFilling}
                onCancel={(): void => handleCancelFillingEdit(entry.entityId)}
                onPreview={(): void => handlePreviewFilling(entry.entityId)}
                onCreateIngredient={handleCreateIngredientFromFilling}
                onCreateProcedure={handleCreateProcedureFromFilling}
              />
            )
          };
        }

        // Preview mode
        if (entry.mode === 'preview') {
          const draftEntity =
            editingRef.current?.id === entry.entityId ? editingRef.current.wrapper.current : undefined;
          return {
            key: `${entry.entityId}:preview`,
            label: `Preview: ${result.value.name}`,
            content: (
              <FillingPreviewPanel
                filling={result.value}
                draftEntity={draftEntity}
                targetYield={targetYieldMap.get(entry.entityId)}
                onClose={(): void => handleCloseFillingPreview(entry.entityId)}
              />
            )
          };
        }

        // View mode
        const fillingId = entry.entityId as FillingId;
        const savedVariationSpec = viewVariationSpecRef.current;
        viewVariationSpecRef.current = undefined;
        return {
          key: entry.entityId,
          label: result.value.name,
          content: (
            <FillingDetail
              filling={result.value}
              defaultVariationSpec={savedVariationSpec}
              onIngredientClick={onIngredientClick}
              onProcedureClick={onProcedureClick}
              onCompareVariations={(specs): void => setVariationCompare({ id: fillingId, specs })}
              onEdit={(spec): void => handleEditFilling(entry.entityId, spec)}
              onPreview={(): void => handlePreviewFilling(entry.entityId)}
              targetYield={targetYieldMap.get(entry.entityId)}
              onTargetYieldChange={(g): void => handleTargetYieldChange(entry.entityId, g)}
            />
          )
        };
      }

      if (entry.entityType === 'ingredient') {
        // Sub-entity create mode
        if (entry.mode === 'create') {
          return {
            key: '__new_ingredient__',
            label: 'New Ingredient',
            content: (
              <EntityCreateForm<Entities.Ingredients.IngredientEntity>
                slugify={slugify}
                buildPrompt={AiAssist.buildIngredientAiPrompt}
                convert={(from: unknown) => Entities.Ingredients.Converters.ingredientEntity.convert(from)}
                makeBlank={(name: string, id: string): Entities.Ingredients.IngredientEntity =>
                  createBlankIngredientEntity(id as BaseIngredientId, name)
                }
                onCreate={handleSubEntityIngredientCreate}
                onCancel={handleSubEntityCancel}
                namePlaceholder="e.g. Callebaut 811 Dark"
                entityLabel="Ingredient"
                initialName={subEntitySeed}
              />
            )
          };
        }

        const result = workspace.data.ingredients.get(entry.entityId as IngredientId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load ingredient: {entry.entityId}</div>
          };
        }

        if (entry.mode === 'edit') {
          const wrapper = getOrCreateSubIngredientWrapper(result.value);
          if (!wrapper) {
            return {
              key: entry.entityId,
              label: result.value.name,
              content: <div className="p-4 text-red-500">Failed to create editing wrapper</div>
            };
          }
          return {
            key: `${entry.entityId}:edit`,
            label: `Editing: ${result.value.name}`,
            content: (
              <IngredientEditView
                wrapper={wrapper}
                onSave={handleSubIngredientSave}
                onCancel={handleSubIngredientCancel}
              />
            )
          };
        }

        return {
          key: entry.entityId,
          label: result.value.name,
          content: (
            <IngredientDetail
              ingredient={result.value}
              onEdit={(): void => {
                squashCascade([
                  ...cascadeStack.slice(0, index),
                  { ...cascadeStack[index], mode: 'edit' as const }
                ]);
              }}
            />
          )
        };
      }

      if (entry.entityType === 'procedure') {
        // Sub-entity create mode
        if (entry.mode === 'create') {
          return {
            key: '__new_procedure__',
            label: 'New Procedure',
            content: (
              <EntityCreateForm<Entities.Procedures.IProcedureEntity>
                slugify={slugify}
                buildPrompt={(name: string): string => name}
                convert={(from: unknown) => Entities.Procedures.Converters.procedureEntity.convert(from)}
                makeBlank={(name: string, id: string): Entities.Procedures.IProcedureEntity =>
                  createBlankRawProcedureEntity(id as BaseProcedureId, name)
                }
                onCreate={handleSubEntityProcedureCreate}
                onCancel={handleSubEntityCancel}
                namePlaceholder="e.g. Ganache Preparation"
                entityLabel="Procedure"
                initialName={subEntitySeed}
              />
            )
          };
        }

        const result = workspace.data.procedures.get(entry.entityId as ProcedureId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load procedure: {entry.entityId}</div>
          };
        }

        if (entry.mode === 'edit') {
          const wrapper = getOrCreateSubProcedureWrapper(result.value);
          if (!wrapper) {
            return {
              key: entry.entityId,
              label: result.value.name,
              content: <div className="p-4 text-red-500">Failed to create editing wrapper</div>
            };
          }
          return {
            key: `${entry.entityId}:edit`,
            label: `Editing: ${result.value.name}`,
            content: (
              <ProcedureEditView
                wrapper={wrapper}
                availableTasks={availableTasks}
                onSave={handleSubProcedureSave}
                onCancel={handleSubProcedureCancel}
                onEditStepTask={procedureSession.onEditStepTask}
                onEditStepParams={procedureSession.onEditStepParams}
              />
            )
          };
        }

        return {
          key: entry.entityId,
          label: result.value.name,
          content: (
            <ProcedureDetail
              procedure={result.value}
              onTaskClick={onTaskClick}
              onEdit={(): void => {
                squashCascade([
                  ...cascadeStack.slice(0, index),
                  { ...cascadeStack[index], mode: 'edit' as const }
                ]);
              }}
            />
          )
        };
      }

      if (entry.entityType === 'task') {
        const result = workspace.data.tasks.get(entry.entityId as TaskId);
        if (result.isFailure()) {
          // Check for inline task from parent procedure
          const parentProcEntry = cascadeStack
            .slice(0, index)
            .reverse()
            .find((e) => e.entityType === 'procedure');
          if (parentProcEntry) {
            const proc = workspace.data.procedures.get(parentProcEntry.entityId as ProcedureId);
            const steps = proc.isSuccess() ? proc.value.getSteps() : undefined;
            const inlineStep = steps?.isSuccess()
              ? steps.value.find((s) => s.isInline && s.resolvedTask.id === entry.entityId)
              : undefined;
            if (inlineStep) {
              return {
                key: entry.entityId,
                label: `${inlineStep.resolvedTask.name} (inline)`,
                content: <TaskDetail task={inlineStep.resolvedTask} />
              };
            }
          }
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load task: {entry.entityId}</div>
          };
        }
        return {
          key: entry.entityId,
          label: result.value.name,
          content: <TaskDetail task={result.value} />
        };
      }

      // Delegate step-params and task entries to the procedure editing session hook
      const hookColumn = procedureSession.renderCascadeEntry(entry, index);
      if (hookColumn) {
        return hookColumn;
      }

      return {
        key: entry.entityId,
        label: entry.entityId,
        content: <div className="p-4 text-gray-500">Unknown entity type: {entry.entityType}</div>
      };
    });
  }, [
    cascadeStack,
    workspace,
    squashAt,
    availableIngredients,
    availableProcedures,
    availableTasks,
    getOrCreateEditingState,
    getOrCreateSubIngredientWrapper,
    getOrCreateSubProcedureWrapper,
    handleEditFilling,
    handlePreviewFilling,
    handleCloseFillingPreview,
    handleTargetYieldChange,
    targetYieldMap,
    handleCancelFillingEdit,
    handleSaveFilling,
    handleVariationChange,
    handleCreateFilling,
    handleCreateFormCancel,
    handleCreateIngredientFromFilling,
    handleCreateProcedureFromFilling,
    handleSubEntityIngredientCreate,
    handleSubEntityProcedureCreate,
    handleSubEntityCancel,
    handleSubIngredientSave,
    handleSubIngredientCancel,
    handleSubProcedureSave,
    handleSubProcedureCancel,
    procedureSession,
    subEntitySeed
  ]);

  const comparisonColumns = useMemo<ReadonlyArray<IComparisonColumn>>(() => {
    return Array.from(compareIds).map((id) => {
      const result = workspace.data.fillings.get(id as FillingId);
      if (result.isFailure()) {
        return { key: id, label: id, content: <div className="p-4 text-red-500">Not found: {id}</div> };
      }
      return { key: id, label: result.value.name, content: <FillingDetail filling={result.value} /> };
    });
  }, [compareIds, workspace]);

  const variationCompareColumns = useMemo<ReadonlyArray<IComparisonColumn> | undefined>(() => {
    if (variationCompare === undefined) {
      return undefined;
    }
    const result = workspace.data.fillings.get(variationCompare.id);
    if (result.isFailure()) {
      return undefined;
    }
    const filling = result.value;
    const specsSet = new Set(variationCompare.specs);
    return filling.variations
      .filter((v) => specsSet.has(v.variationSpec))
      .map((v) => ({
        key: v.variationSpec,
        label: `${filling.name} — ${v.variationSpec}${
          v.variationSpec === filling.goldenVariationSpec ? ' ★' : ''
        }`,
        content: <FillingDetail filling={filling} defaultVariationSpec={v.variationSpec} />
      }));
  }, [variationCompare, workspace]);

  return (
    <EntityTabLayout
      list={
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
            <button
              onClick={handleNewFilling}
              disabled={mutableCollectionId === undefined}
              title={mutableCollectionId === undefined ? 'No mutable collection available' : undefined}
              className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              + New Filling
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <EntityList<LibraryRuntime.FillingRecipe, FillingId>
              entities={useFilteredEntities(fillings, FILLING_FILTER_SPEC)}
              descriptor={FILLING_DESCRIPTOR}
              selectedId={selectedId}
              onSelect={handleSelect}
              onDrill={collapseList}
              compareMode={compareMode}
              checkedIds={compareIds}
              onCheckedChange={toggleCompareId}
              onToggleCompare={toggleCompareMode}
              compareCount={compareIds.size}
              onStartComparison={startComparison}
              emptyState={{
                title: 'No Fillings',
                description: 'No filling recipes found in the library.'
              }}
            />
          </div>
        </div>
      }
      cascadeColumns={cascadeColumns}
      onPopTo={popCascadeTo}
      listCollapsed={listCollapsed}
      onListCollapse={collapseList}
      compareMode={compareMode}
      comparisonColumns={comparisonColumns}
      showingComparison={showingComparison}
      onExitComparison={exitComparison}
      variationCompareColumns={variationCompareColumns}
      onExitVariationCompare={(): void => setVariationCompare(undefined)}
    />
  );
}
