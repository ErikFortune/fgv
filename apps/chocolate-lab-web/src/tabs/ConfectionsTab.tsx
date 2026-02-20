import React, { useCallback, useMemo, useRef, useState } from 'react';
import { EntityList, type ICascadeColumn, EntityTabLayout, type IComparisonColumn } from '@fgv/ts-app-shell';
import { AiAssist, Entities, LibraryRuntime, UserLibrary } from '@fgv/ts-chocolate';
import type {
  BaseConfectionId,
  BaseFillingId,
  BaseIngredientId,
  BaseProcedureId,
  CollectionId,
  ConfectionRecipeVariationSpec,
  IngredientId,
  FillingId,
  MoldId,
  TaskId,
  ProcedureId,
  ConfectionId,
  DecorationId
} from '@fgv/ts-chocolate';
import {
  type ICascadeEntry,
  useTabNavigation,
  useEntityList,
  useMutableCollection,
  IngredientDetail,
  IngredientEditView,
  FillingDetail,
  FillingEditView,
  FillingSaveMode,
  MoldDetail,
  ProcedureDetail,
  ProcedureEditView,
  TaskDetail,
  ConfectionDetail,
  ConfectionEditView,
  ConfectionPreviewPanel,
  DecorationDetail,
  useFilteredEntities,
  EntityCreateForm,
  type IConfectionViewSettings
} from '@fgv/chocolate-lab-ui';

import {
  CONFECTION_DESCRIPTOR,
  CONFECTION_FILTER_SPEC,
  slugify,
  createBlankIngredientEntity,
  createBlankRawProcedureEntity,
  createBlankFillingRecipeEntity
} from '../shared';

interface IConfectionEditingState {
  readonly id: string;
  readonly wrapper: LibraryRuntime.EditedConfectionRecipe;
  selectedVariationSpec: ConfectionRecipeVariationSpec;
}

export function ConfectionsTabContent(): React.ReactElement {
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
    { id: ConfectionId; specs: ReadonlyArray<string> } | undefined
  >(undefined);

  const mutableCollectionId = useMutableCollection(workspace.data.entities.confections.collections, [
    workspace,
    reactiveWorkspace.version
  ]);

  const editingRef = useRef<IConfectionEditingState | undefined>(undefined);
  const editVariationSpecRef = useRef<ConfectionRecipeVariationSpec | undefined>(undefined);
  const viewVariationSpecRef = useRef<ConfectionRecipeVariationSpec | undefined>(undefined);

  const [viewSettingsMap, setViewSettingsMap] = useState<Map<string, IConfectionViewSettings>>(
    () => new Map()
  );
  const handleViewSettingsChange = useCallback(
    (entityId: string, settings: IConfectionViewSettings): void => {
      setViewSettingsMap((prev) => {
        const next = new Map(prev);
        next.set(entityId, settings);
        return next;
      });
    },
    []
  );

  const [saveAsName, setSaveAsName] = useState('');
  const [showSaveAsForm, setShowSaveAsForm] = useState(false);
  const subIngredientRef = useRef<{ id: string; wrapper: LibraryRuntime.EditedIngredient } | undefined>(
    undefined
  );
  const subFillingRef = useRef<{ id: string; wrapper: LibraryRuntime.EditedFillingRecipe } | undefined>(
    undefined
  );
  const subProcedureRef = useRef<{ id: string; wrapper: LibraryRuntime.EditedProcedure } | undefined>(
    undefined
  );
  const [subEntitySeed, setSubEntitySeed] = useState('');

  const availableIngredients = useMemo<ReadonlyArray<LibraryRuntime.AnyIngredient>>(() => {
    return Array.from(workspace.data.ingredients.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [workspace, reactiveWorkspace.version]);

  const availableFillings = useMemo<ReadonlyArray<LibraryRuntime.FillingRecipe>>(() => {
    return Array.from(workspace.data.fillings.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [workspace, reactiveWorkspace.version]);

  const availableProcedures = useMemo<ReadonlyArray<LibraryRuntime.IProcedure>>(() => {
    return Array.from(workspace.data.procedures.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [workspace, reactiveWorkspace.version]);

  const availableTasks = useMemo<ReadonlyArray<LibraryRuntime.ITask>>(() => {
    return Array.from(workspace.data.tasks.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [workspace, reactiveWorkspace.version]);

  const availableMolds = useMemo<ReadonlyArray<LibraryRuntime.IMold>>(() => {
    return Array.from(workspace.data.molds.values()).sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    );
  }, [workspace, reactiveWorkspace.version]);

  const availableDecorations = useMemo<ReadonlyArray<LibraryRuntime.IDecoration>>(() => {
    return Array.from(workspace.data.decorations.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [workspace, reactiveWorkspace.version]);

  const { entities: confections, selectedId } = useEntityList<LibraryRuntime.AnyConfection, ConfectionId>({
    getAll: () => workspace.data.confections.values(),
    compare: (a, b) => a.name.localeCompare(b.name),
    entityType: 'confection',
    cascadeStack,
    deps: [workspace, reactiveWorkspace.version]
  });

  const handleSelect = useCallback(
    (id: ConfectionId): void => {
      const entry: ICascadeEntry = { entityType: 'confection', entityId: id, mode: 'view' };
      squashCascade([entry]);
    },
    [squashCascade]
  );

  // Depth-aware squash: keep stack up to and including the pane at `depth`, then append the new entry.
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
      confection: LibraryRuntime.AnyConfection,
      preferredSpec?: ConfectionRecipeVariationSpec
    ): IConfectionEditingState | undefined => {
      const id = confection.id;
      if (editingRef.current?.id === id) {
        return editingRef.current;
      }

      const wrapperResult = LibraryRuntime.EditedConfectionRecipe.create(confection.entity);
      if (wrapperResult.isFailure()) {
        workspace.data.logger.error(`Failed to create confection wrapper: ${wrapperResult.message}`);
        return undefined;
      }

      const targetSpec = preferredSpec ?? confection.goldenVariationSpec;
      const state: IConfectionEditingState = {
        id,
        wrapper: wrapperResult.value,
        selectedVariationSpec: targetSpec
      };
      editingRef.current = state;
      return state;
    },
    [workspace]
  );

  const handleVariationChange = useCallback((spec: ConfectionRecipeVariationSpec): void => {
    const state = editingRef.current;
    if (!state) return;
    state.selectedVariationSpec = spec;
  }, []);

  // ============================================================================
  // Edit / Cancel / Save
  // ============================================================================

  const handleEditConfection = useCallback(
    (entityId: string, variationSpec?: ConfectionRecipeVariationSpec): void => {
      const idx = cascadeStack.findIndex((e) => e.entityId === entityId && e.entityType === 'confection');
      if (idx < 0) return;
      editVariationSpecRef.current = variationSpec;
      squashCascade([...cascadeStack.slice(0, idx), { ...cascadeStack[idx], mode: 'edit' as const }]);
    },
    [cascadeStack, squashCascade]
  );

  const handlePreviewConfection = useCallback(
    (entityId: string): void => {
      const idx = cascadeStack.findIndex((e) => e.entityId === entityId && e.entityType === 'confection');
      if (idx < 0) return;
      squashCascade([
        ...cascadeStack.slice(0, idx + 1),
        { entityType: 'confection', entityId, mode: 'preview' }
      ]);
    },
    [cascadeStack, squashCascade]
  );

  const handleCloseConfectionPreview = useCallback(
    (entityId: string): void => {
      squashCascade(
        cascadeStack.filter(
          (e) => !(e.entityType === 'confection' && e.entityId === entityId && e.mode === 'preview')
        )
      );
    },
    [cascadeStack, squashCascade]
  );

  const handleCancelConfectionEdit = useCallback(
    (entityId: string): void => {
      if (editingRef.current?.id === entityId) {
        editingRef.current = undefined;
      }
      subIngredientRef.current = undefined;
      subFillingRef.current = undefined;
      subProcedureRef.current = undefined;
      const updated = cascadeStack.map((e) =>
        e.entityId === entityId && e.entityType === 'confection' ? { ...e, mode: 'view' as const } : e
      );
      squashCascade(updated);
    },
    [cascadeStack, squashCascade]
  );

  // ============================================================================
  // Sub-Entity Creation (Ingredients / Fillings / Procedures from Confection Editor)
  // ============================================================================

  const handleCreateIngredientFromConfection = useCallback(
    (seed: string): void => {
      const editIdx = cascadeStack.findIndex((e) => e.entityType === 'confection' && e.mode === 'edit');
      if (editIdx < 0) return;
      setSubEntitySeed(seed);
      squashCascade([
        ...cascadeStack.slice(0, editIdx + 1),
        { entityType: 'ingredient', entityId: '__new__', mode: 'create' }
      ]);
    },
    [cascadeStack, squashCascade]
  );

  const handleCreateFillingFromConfection = useCallback(
    (seed: string): void => {
      const editIdx = cascadeStack.findIndex((e) => e.entityType === 'confection' && e.mode === 'edit');
      if (editIdx < 0) return;
      setSubEntitySeed(seed);
      squashCascade([
        ...cascadeStack.slice(0, editIdx + 1),
        { entityType: 'filling', entityId: '__new__', mode: 'create' }
      ]);
    },
    [cascadeStack, squashCascade]
  );

  const handleCreateProcedureFromConfection = useCallback(
    (seed: string): void => {
      const editIdx = cascadeStack.findIndex((e) => e.entityType === 'confection' && e.mode === 'edit');
      if (editIdx < 0) return;
      setSubEntitySeed(seed);
      squashCascade([
        ...cascadeStack.slice(0, editIdx + 1),
        { entityType: 'procedure', entityId: '__new__', mode: 'create' }
      ]);
    },
    [cascadeStack, squashCascade]
  );

  const handleSubEntityCancel = useCallback((): void => {
    setSubEntitySeed('');
    const editIdx = cascadeStack.findIndex((e) => e.entityType === 'confection' && e.mode === 'edit');
    if (editIdx >= 0) {
      squashCascade(cascadeStack.slice(0, editIdx + 1));
    } else {
      squashCascade([]);
    }
  }, [cascadeStack, squashCascade]);

  const handleSubIngredientCreate = useCallback(
    (entity: Entities.Ingredients.IngredientEntity, __source: 'manual' | 'ai'): void => {
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
      const colResult = workspace.data.entities.ingredients.collections.get(ingredientCollectionId);
      if (colResult.isFailure() || !colResult.value.isMutable) return;
      colResult.value.items.set(baseId, entity);
      const editableResult =
        workspace.data.entities.getEditableIngredientsEntityCollection(ingredientCollectionId);
      if (editableResult.isSuccess()) {
        const editable = editableResult.value;
        editable.set(baseId, entity);
        if (editable.canSave()) editable.save();
      }
      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();
      setSubEntitySeed('');
      const wrapperResult = LibraryRuntime.EditedIngredient.create(entity);
      if (wrapperResult.isSuccess()) {
        subIngredientRef.current = { id: compositeId, wrapper: wrapperResult.value };
      }
      const editIdx = cascadeStack.findIndex((e) => e.entityType === 'confection' && e.mode === 'edit');
      if (editIdx >= 0) {
        squashCascade([
          ...cascadeStack.slice(0, editIdx + 1),
          { entityType: 'ingredient', entityId: compositeId, mode: 'edit' }
        ]);
      }
    },
    [workspace, reactiveWorkspace, cascadeStack, squashCascade]
  );

  const handleSubIngredientSave = useCallback(
    (wrapper: LibraryRuntime.EditedIngredient): void => {
      const entity = wrapper.current;
      const compositeId = subIngredientRef.current?.id;
      if (!compositeId) return;
      const collectionId = compositeId.split('.')[0] as CollectionId;
      const baseId = entity.baseId as BaseIngredientId;
      const colResult = workspace.data.entities.ingredients.collections.get(collectionId);
      if (colResult.isFailure() || !colResult.value.isMutable) return;
      colResult.value.items.set(baseId, entity);
      const editableResult = workspace.data.entities.getEditableIngredientsEntityCollection(collectionId);
      if (editableResult.isSuccess()) {
        const editable = editableResult.value;
        editable.set(baseId, entity);
        if (editable.canSave()) editable.save();
      }
      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();
      subIngredientRef.current = undefined;
      const editIdx = cascadeStack.findIndex((e) => e.entityType === 'confection' && e.mode === 'edit');
      if (editIdx >= 0) squashCascade(cascadeStack.slice(0, editIdx + 1));
    },
    [workspace, reactiveWorkspace, cascadeStack, squashCascade]
  );

  const handleSubIngredientCancel = useCallback((): void => {
    subIngredientRef.current = undefined;
    const editIdx = cascadeStack.findIndex((e) => e.entityType === 'confection' && e.mode === 'edit');
    if (editIdx >= 0) squashCascade(cascadeStack.slice(0, editIdx + 1));
  }, [cascadeStack, squashCascade]);

  const handleSubFillingCreate = useCallback(
    (entity: Entities.Fillings.IFillingRecipeEntity, __source: 'manual' | 'ai'): void => {
      let fillingCollectionId: CollectionId | undefined;
      for (const [id, col] of workspace.data.entities.fillings.collections.entries()) {
        if (col.isMutable) {
          fillingCollectionId = id as CollectionId;
          break;
        }
      }
      if (!fillingCollectionId) {
        workspace.data.logger.error('Cannot add filling: no mutable filling collection available');
        return;
      }
      const baseId = entity.baseId as BaseFillingId;
      const compositeId = `${fillingCollectionId}.${baseId}` as FillingId;
      const colResult = workspace.data.entities.fillings.collections.get(fillingCollectionId);
      if (colResult.isFailure() || !colResult.value.isMutable) return;
      colResult.value.items.set(baseId, entity);
      const editableResult =
        workspace.data.entities.getEditableFillingsRecipeEntityCollection(fillingCollectionId);
      if (editableResult.isSuccess()) {
        const editable = editableResult.value;
        editable.set(baseId, entity);
        if (editable.canSave()) editable.save();
      }
      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();
      setSubEntitySeed('');
      const wrapperResult = LibraryRuntime.EditedFillingRecipe.create(entity);
      if (wrapperResult.isSuccess()) {
        subFillingRef.current = { id: compositeId, wrapper: wrapperResult.value };
      }
      const editIdx = cascadeStack.findIndex((e) => e.entityType === 'confection' && e.mode === 'edit');
      if (editIdx >= 0) {
        squashCascade([
          ...cascadeStack.slice(0, editIdx + 1),
          { entityType: 'filling', entityId: compositeId, mode: 'edit' }
        ]);
      }
    },
    [workspace, reactiveWorkspace, cascadeStack, squashCascade]
  );

  const handleSubFillingSave = useCallback(
    (__mode: FillingSaveMode): void => {
      const subState = subFillingRef.current;
      if (!subState) return;
      const entity = subState.wrapper.current;
      const compositeId = subState.id;
      const collectionId = compositeId.split('.')[0] as CollectionId;
      const baseId = entity.baseId as BaseFillingId;
      const colResult = workspace.data.entities.fillings.collections.get(collectionId);
      if (colResult.isFailure() || !colResult.value.isMutable) return;
      colResult.value.items.set(baseId, entity);
      const editableResult = workspace.data.entities.getEditableFillingsRecipeEntityCollection(collectionId);
      if (editableResult.isSuccess()) {
        const editable = editableResult.value;
        editable.set(baseId, entity);
        if (editable.canSave()) editable.save();
      }
      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();
      subFillingRef.current = undefined;
      const editIdx = cascadeStack.findIndex((e) => e.entityType === 'confection' && e.mode === 'edit');
      if (editIdx >= 0) squashCascade(cascadeStack.slice(0, editIdx + 1));
    },
    [workspace, reactiveWorkspace, cascadeStack, squashCascade]
  );

  const handleSubFillingCancel = useCallback((): void => {
    subFillingRef.current = undefined;
    const editIdx = cascadeStack.findIndex((e) => e.entityType === 'confection' && e.mode === 'edit');
    if (editIdx >= 0) squashCascade(cascadeStack.slice(0, editIdx + 1));
  }, [cascadeStack, squashCascade]);

  const handleSubProcedureCreate = useCallback(
    (entity: Entities.Procedures.IProcedureEntity, __source: 'manual' | 'ai'): void => {
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
      const colResult = workspace.data.entities.procedures.collections.get(procedureCollectionId);
      if (colResult.isFailure() || !colResult.value.isMutable) return;
      colResult.value.items.set(baseId, entity);
      const editableResult =
        workspace.data.entities.getEditableProceduresEntityCollection(procedureCollectionId);
      if (editableResult.isSuccess()) {
        const editable = editableResult.value;
        editable.set(baseId, entity);
        if (editable.canSave()) editable.save();
      }
      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();
      setSubEntitySeed('');
      const wrapperResult = LibraryRuntime.EditedProcedure.create(entity);
      if (wrapperResult.isSuccess()) {
        subProcedureRef.current = { id: compositeId, wrapper: wrapperResult.value };
      }
      const editIdx = cascadeStack.findIndex((e) => e.entityType === 'confection' && e.mode === 'edit');
      if (editIdx >= 0) {
        squashCascade([
          ...cascadeStack.slice(0, editIdx + 1),
          { entityType: 'procedure', entityId: compositeId, mode: 'edit' }
        ]);
      }
    },
    [workspace, reactiveWorkspace, cascadeStack, squashCascade]
  );

  const handleSubProcedureSave = useCallback(
    (wrapper: LibraryRuntime.EditedProcedure): void => {
      const entity = wrapper.current;
      const compositeId = subProcedureRef.current?.id;
      if (!compositeId) return;
      const collectionId = compositeId.split('.')[0] as CollectionId;
      const baseId = entity.baseId as BaseProcedureId;
      const colResult = workspace.data.entities.procedures.collections.get(collectionId);
      if (colResult.isFailure() || !colResult.value.isMutable) return;
      colResult.value.items.set(baseId, entity);
      const editableResult = workspace.data.entities.getEditableProceduresEntityCollection(collectionId);
      if (editableResult.isSuccess()) {
        const editable = editableResult.value;
        editable.set(baseId, entity);
        if (editable.canSave()) editable.save();
      }
      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();
      subProcedureRef.current = undefined;
      const editIdx = cascadeStack.findIndex((e) => e.entityType === 'confection' && e.mode === 'edit');
      if (editIdx >= 0) squashCascade(cascadeStack.slice(0, editIdx + 1));
    },
    [workspace, reactiveWorkspace, cascadeStack, squashCascade]
  );

  const handleSubProcedureCancel = useCallback((): void => {
    subProcedureRef.current = undefined;
    const editIdx = cascadeStack.findIndex((e) => e.entityType === 'confection' && e.mode === 'edit');
    if (editIdx >= 0) squashCascade(cascadeStack.slice(0, editIdx + 1));
  }, [cascadeStack, squashCascade]);

  const handleSaveAsConfection = useCallback(
    (entityId: string, newName: string): void => {
      const state = editingRef.current;
      if (!state) return;
      if (!mutableCollectionId) {
        workspace.data.logger.error('Save failed: no mutable collection available');
        return;
      }

      const originalEntity = state.wrapper.current;
      const today = new Date().toISOString().split('T')[0]!;
      const safeName = newName.trim() || originalEntity.name;
      const newBaseId = `${slugify(safeName)}-${today}` as BaseConfectionId;
      const newCompositeId = `${mutableCollectionId}.${newBaseId}` as ConfectionId;

      const newEntity: Entities.Confections.AnyConfectionRecipeEntity = {
        ...originalEntity,
        baseId: newBaseId,
        name: safeName as typeof originalEntity.name
      };

      const colResult = workspace.data.entities.confections.collections.get(mutableCollectionId);
      if (colResult.isFailure() || !colResult.value.isMutable) {
        workspace.data.logger.error('Save failed: mutable collection unavailable');
        return;
      }
      const setResult = colResult.value.items.set(newBaseId, newEntity);
      if (setResult.isFailure()) {
        workspace.data.logger.error(`Save failed (in-memory): ${setResult.message}`);
        return;
      }

      const editableResult =
        workspace.data.entities.getEditableConfectionsEntityCollection(mutableCollectionId);
      if (editableResult.isSuccess()) {
        const editable = editableResult.value;
        editable.set(newBaseId, newEntity);
        if (editable.canSave()) {
          const diskResult = editable.save();
          if (diskResult.isFailure()) {
            workspace.data.logger.error(`Disk save failed: ${diskResult.message}`);
          } else {
            workspace.data.logger.info(`Saved copy '${safeName}' to collection '${mutableCollectionId}'`);
          }
        }
      }

      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();
      editingRef.current = undefined;
      setShowSaveAsForm(false);
      setSaveAsName('');
      squashCascade([{ entityType: 'confection', entityId: newCompositeId, mode: 'view' as const }]);
    },
    [workspace, reactiveWorkspace, mutableCollectionId, squashCascade]
  );

  const handleSaveConfection = useCallback(
    (entityId: string): void => {
      const state = editingRef.current;
      if (!state) {
        workspace.data.logger.error('Save failed: no editing state');
        return;
      }

      const entity = state.wrapper.current;
      const compositeId = state.id as ConfectionId;
      const collectionId = compositeId.split('.')[0] as CollectionId;
      const baseId = entity.baseId as BaseConfectionId;

      const collectionEntry = workspace.data.entities.confections.collections.get(collectionId);
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

      const editableResult = workspace.data.entities.getEditableConfectionsEntityCollection(collectionId);
      if (editableResult.isSuccess()) {
        const editable = editableResult.value;
        editable.set(baseId, entity);
        if (editable.canSave()) {
          const saveResult = editable.save();
          if (saveResult.isFailure()) {
            workspace.data.logger.error(`Disk save failed: ${saveResult.message}`);
          } else {
            workspace.data.logger.info(`Saved confection '${entity.name}' to collection '${collectionId}'`);
          }
        } else {
          workspace.data.logger.info(
            `Updated confection '${entity.name}' in-memory (collection '${collectionId}' has no backing file)`
          );
        }
      } else {
        workspace.data.logger.info(
          `Updated confection '${entity.name}' in-memory only: ${editableResult.message}`
        );
      }

      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();

      viewVariationSpecRef.current = editingRef.current?.selectedVariationSpec;

      if (editingRef.current?.id === entityId) {
        editingRef.current = undefined;
      }
      const updated = cascadeStack.map((e) =>
        e.entityId === entityId && e.entityType === 'confection' ? { ...e, mode: 'view' as const } : e
      );
      squashCascade(updated);
    },
    [workspace, reactiveWorkspace, cascadeStack, squashCascade]
  );

  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascadeStack.map((entry, index) => {
      // Per-pane drill-down callbacks that squash to the right of this pane
      const onIngredientClick = (id: IngredientId): void => {
        squashAt(index, { entityType: 'ingredient', entityId: id, mode: 'view' });
      };
      const onFillingClick = (id: FillingId): void => {
        squashAt(index, { entityType: 'filling', entityId: id, mode: 'view' });
      };
      const onMoldClick = (id: MoldId): void => {
        squashAt(index, { entityType: 'mold', entityId: id, mode: 'view' });
      };
      const onProcedureClick = (id: ProcedureId): void => {
        squashAt(index, { entityType: 'procedure', entityId: id, mode: 'view' });
      };
      const onDecorationClick = (id: DecorationId): void => {
        squashAt(index, { entityType: 'decoration', entityId: id, mode: 'view' });
      };
      const onTaskClick = (id: TaskId): void => {
        squashAt(index, { entityType: 'task', entityId: id, mode: 'view' });
      };

      if (entry.entityType === 'confection') {
        const result = workspace.data.confections.get(entry.entityId as ConfectionId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load confection: {entry.entityId}</div>
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
          const sourceCollectionId = (state.id as string).split('.')[0] as CollectionId;
          const sourceColResult = workspace.data.entities.confections.collections.get(sourceCollectionId);
          const isSourceReadOnly = sourceColResult.isSuccess() && !sourceColResult.value.isMutable;
          return {
            key: `${entry.entityId}:edit`,
            label: `Editing: ${result.value.name}`,
            content: (
              <div className="flex flex-col h-full">
                {showSaveAsForm && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200">
                    <span className="text-xs text-amber-800 shrink-0">Save as:</span>
                    <input
                      type="text"
                      value={saveAsName}
                      onChange={(e): void => setSaveAsName(e.target.value)}
                      onKeyDown={(e): void => {
                        if (e.key === 'Enter') handleSaveAsConfection(entry.entityId, saveAsName);
                        if (e.key === 'Escape') {
                          setShowSaveAsForm(false);
                          setSaveAsName('');
                        }
                      }}
                      placeholder={result.value.name}
                      className="flex-1 text-xs border border-amber-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-choco-primary"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={(): void => handleSaveAsConfection(entry.entityId, saveAsName)}
                      className="px-2.5 py-1 text-xs rounded bg-choco-primary text-white hover:bg-choco-primary/90"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={(): void => {
                        setShowSaveAsForm(false);
                        setSaveAsName('');
                      }}
                      className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <ConfectionEditView
                  wrapper={state.wrapper}
                  confection={result.value}
                  selectedVariationSpec={state.selectedVariationSpec}
                  onVariationChange={handleVariationChange}
                  availableIngredients={availableIngredients}
                  availableFillings={availableFillings}
                  availableProcedures={availableProcedures}
                  onAddIngredient={handleCreateIngredientFromConfection}
                  onAddFilling={handleCreateFillingFromConfection}
                  onAddProcedure={handleCreateProcedureFromConfection}
                  availableMolds={availableMolds}
                  availableDecorations={availableDecorations}
                  readOnly={isSourceReadOnly}
                  onSave={(): void => handleSaveConfection(entry.entityId)}
                  onSaveAs={
                    mutableCollectionId
                      ? (): void => {
                          setSaveAsName(result.value.name);
                          setShowSaveAsForm(true);
                        }
                      : undefined
                  }
                  onCancel={(): void => handleCancelConfectionEdit(entry.entityId)}
                  onFillingClick={onFillingClick}
                  onIngredientClick={onIngredientClick}
                  onMoldClick={onMoldClick}
                  onProcedureClick={onProcedureClick}
                  onDecorationClick={onDecorationClick}
                />
              </div>
            )
          };
        }

        // View mode (default)
        const defaultSpec =
          viewVariationSpecRef.current !== undefined &&
          result.value.entity.variations.some((v) => v.variationSpec === viewVariationSpecRef.current)
            ? viewVariationSpecRef.current
            : undefined;
        if (defaultSpec !== undefined) {
          viewVariationSpecRef.current = undefined;
        }
        const entityId = entry.entityId;

        // Preview mode
        if (entry.mode === 'preview') {
          return {
            key: `${entityId}:preview`,
            label: `Preview: ${result.value.name}`,
            content: (
              <ConfectionPreviewPanel
                confection={result.value}
                viewSettings={viewSettingsMap.get(entityId)}
                onClose={(): void => handleCloseConfectionPreview(entityId)}
              />
            )
          };
        }

        return {
          key: entityId,
          label: result.value.name,
          content: (
            <ConfectionDetail
              confection={result.value}
              defaultVariationSpec={defaultSpec}
              onFillingClick={onFillingClick}
              onIngredientClick={onIngredientClick}
              onMoldClick={onMoldClick}
              onProcedureClick={onProcedureClick}
              onDecorationClick={onDecorationClick}
              onCompareVariations={(specs): void =>
                setVariationCompare({ id: entityId as ConfectionId, specs })
              }
              onEdit={(spec): void => handleEditConfection(entityId, spec)}
              onPreview={(): void => handlePreviewConfection(entityId)}
              viewSettings={viewSettingsMap.get(entityId)}
              onViewSettingsChange={(s): void => handleViewSettingsChange(entityId, s)}
            />
          )
        };
      }
      if (entry.entityType === 'filling') {
        if (entry.mode === 'create') {
          return {
            key: '__new_filling__',
            label: 'New Filling',
            content: (
              <EntityCreateForm<Entities.Fillings.IFillingRecipeEntity>
                slugify={slugify}
                buildPrompt={AiAssist.buildFillingAiPrompt}
                convert={(from: unknown) => Entities.Fillings.Converters.fillingRecipeEntity.convert(from)}
                makeBlank={(name: string, id: string): Entities.Fillings.IFillingRecipeEntity =>
                  createBlankFillingRecipeEntity(id as BaseFillingId, name)
                }
                initialName={subEntitySeed}
                onCreate={handleSubFillingCreate}
                onCancel={handleSubEntityCancel}
              />
            )
          };
        }
        if (entry.mode === 'edit') {
          const subState = subFillingRef.current;
          const fillingResult = workspace.data.fillings.get(entry.entityId as FillingId);
          if (subState && fillingResult.isSuccess()) {
            const goldenSpec = fillingResult.value.goldenVariationSpec;
            const variationResult = fillingResult.value.getVariation(goldenSpec);
            const sessionResult = variationResult.isSuccess()
              ? UserLibrary.Session.EditingSession.create(variationResult.value)
              : undefined;
            if (sessionResult?.isSuccess()) {
              return {
                key: `${entry.entityId}:sub-edit`,
                label: `Editing: ${fillingResult.value.name}`,
                content: (
                  <FillingEditView
                    wrapper={subState.wrapper}
                    session={sessionResult.value}
                    selectedVariationSpec={goldenSpec}
                    onVariationChange={(): void => undefined}
                    availableIngredients={availableIngredients}
                    availableProcedures={availableProcedures}
                    onSave={handleSubFillingSave}
                    onCancel={handleSubFillingCancel}
                  />
                )
              };
            }
          }
        }
        const result = workspace.data.fillings.get(entry.entityId as FillingId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load filling: {entry.entityId}</div>
          };
        }
        return {
          key: entry.entityId,
          label: result.value.name,
          content: (
            <FillingDetail
              filling={result.value}
              onIngredientClick={onIngredientClick}
              onProcedureClick={onProcedureClick}
            />
          )
        };
      }
      if (entry.entityType === 'ingredient') {
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
                initialName={subEntitySeed}
                onCreate={handleSubIngredientCreate}
                onCancel={handleSubEntityCancel}
              />
            )
          };
        }
        if (entry.mode === 'edit') {
          const subState = subIngredientRef.current;
          const ingResult = workspace.data.ingredients.get(entry.entityId as IngredientId);
          if (subState && ingResult.isSuccess()) {
            return {
              key: `${entry.entityId}:sub-edit`,
              label: `Editing: ${ingResult.value.name}`,
              content: (
                <IngredientEditView
                  wrapper={subState.wrapper}
                  onSave={handleSubIngredientSave}
                  onCancel={handleSubIngredientCancel}
                />
              )
            };
          }
        }
        const result = workspace.data.ingredients.get(entry.entityId as IngredientId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load ingredient: {entry.entityId}</div>
          };
        }
        return {
          key: entry.entityId,
          label: result.value.name,
          content: <IngredientDetail ingredient={result.value} />
        };
      }
      if (entry.entityType === 'mold') {
        const result = workspace.data.molds.get(entry.entityId as MoldId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load mold: {entry.entityId}</div>
          };
        }
        return {
          key: entry.entityId,
          label: result.value.displayName,
          content: <MoldDetail mold={result.value} />
        };
      }
      if (entry.entityType === 'decoration') {
        const result = workspace.data.decorations.get(entry.entityId as DecorationId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load decoration: {entry.entityId}</div>
          };
        }
        return {
          key: entry.entityId,
          label: result.value.name,
          content: (
            <DecorationDetail
              decoration={result.value}
              onIngredientClick={onIngredientClick}
              onProcedureClick={onProcedureClick}
            />
          )
        };
      }
      if (entry.entityType === 'procedure') {
        if (entry.mode === 'create') {
          return {
            key: '__new_procedure__',
            label: 'New Procedure',
            content: (
              <EntityCreateForm<Entities.Procedures.IProcedureEntity>
                slugify={slugify}
                buildPrompt={AiAssist.buildProcedureAiPrompt}
                convert={(from: unknown) => Entities.Procedures.Converters.procedureEntity.convert(from)}
                makeBlank={(name: string, id: string): Entities.Procedures.IProcedureEntity =>
                  createBlankRawProcedureEntity(id as BaseProcedureId, name)
                }
                initialName={subEntitySeed}
                onCreate={handleSubProcedureCreate}
                onCancel={handleSubEntityCancel}
              />
            )
          };
        }
        if (entry.mode === 'edit') {
          const subState = subProcedureRef.current;
          const procResult = workspace.data.procedures.get(entry.entityId as ProcedureId);
          if (subState && procResult.isSuccess()) {
            return {
              key: `${entry.entityId}:sub-edit`,
              label: `Editing: ${procResult.value.name}`,
              content: (
                <ProcedureEditView
                  wrapper={subState.wrapper}
                  availableTasks={availableTasks}
                  onSave={handleSubProcedureSave}
                  onCancel={handleSubProcedureCancel}
                />
              )
            };
          }
        }
        const result = workspace.data.procedures.get(entry.entityId as ProcedureId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load procedure: {entry.entityId}</div>
          };
        }
        return {
          key: entry.entityId,
          label: result.value.name,
          content: <ProcedureDetail procedure={result.value} onTaskClick={onTaskClick} />
        };
      }
      if (entry.entityType === 'task') {
        const result = workspace.data.tasks.get(entry.entityId as TaskId);
        if (result.isFailure()) {
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
    showSaveAsForm,
    saveAsName,
    handleSaveAsConfection,
    mutableCollectionId,
    viewSettingsMap
  ]);

  const comparisonColumns = useMemo<ReadonlyArray<IComparisonColumn>>(() => {
    return Array.from(compareIds).map((id) => {
      const result = workspace.data.confections.get(id as ConfectionId);
      if (result.isFailure()) {
        return { key: id, label: id, content: <div className="p-4 text-red-500">Not found: {id}</div> };
      }
      return { key: id, label: result.value.name, content: <ConfectionDetail confection={result.value} /> };
    });
  }, [compareIds, workspace]);

  const variationCompareColumns = useMemo<ReadonlyArray<IComparisonColumn> | undefined>(() => {
    if (variationCompare === undefined) {
      return undefined;
    }
    const result = workspace.data.confections.get(variationCompare.id);
    if (result.isFailure()) {
      return undefined;
    }
    const confection = result.value;
    const specsSet = new Set(variationCompare.specs);
    return confection.variations
      .filter((v) => specsSet.has(v.variationSpec))
      .map((v) => ({
        key: v.variationSpec,
        label: `${confection.name} — ${v.variationSpec}${
          v.variationSpec === confection.goldenVariationSpec ? ' ★' : ''
        }`,
        content: <ConfectionDetail confection={confection} defaultVariationSpec={v.variationSpec} />
      }));
  }, [variationCompare, workspace]);

  return (
    <EntityTabLayout
      list={
        <EntityList<LibraryRuntime.IConfectionBase, ConfectionId>
          entities={useFilteredEntities(confections, CONFECTION_FILTER_SPEC)}
          descriptor={CONFECTION_DESCRIPTOR}
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
            title: 'No Confections',
            description: 'No confections found in the library.'
          }}
        />
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
