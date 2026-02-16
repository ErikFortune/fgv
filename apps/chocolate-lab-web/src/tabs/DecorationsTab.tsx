import React, { useCallback, useMemo, useRef, useState } from 'react';
import { EntityList, type ICascadeColumn, EntityTabLayout, type IComparisonColumn } from '@fgv/ts-app-shell';
import { AiAssist, Editing, Entities, LibraryRuntime } from '@fgv/ts-chocolate';
import type {
  BaseIngredientId,
  BaseProcedureId,
  BaseDecorationId,
  CollectionId,
  IngredientId,
  TaskId,
  ProcedureId,
  DecorationId
} from '@fgv/ts-chocolate';
import {
  type ICascadeEntry,
  useTabNavigation,
  useEntityList,
  useMutableCollection,
  IngredientDetail,
  IngredientEditView,
  ProcedureDetail,
  ProcedureEditView,
  DecorationDetail,
  DecorationEditView,
  DecorationPreviewPanel,
  EntityCreateForm,
  useFilteredEntities,
  useProcedureEditSession
} from '@fgv/chocolate-lab-ui';

import {
  DECORATION_DESCRIPTOR,
  DECORATION_FILTER_SPEC,
  slugify,
  createBlankIngredientEntity,
  createBlankRawProcedureEntity,
  createBlankDecorationEntity
} from '../shared';

export function DecorationsTabContent(): React.ReactElement {
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

  const editingRef = useRef<{ id: string; wrapper: LibraryRuntime.EditedDecoration } | undefined>(undefined);
  const subIngredientRef = useRef<{ id: string; wrapper: LibraryRuntime.EditedIngredient } | undefined>(
    undefined
  );
  const subProcedureRef = useRef<{ id: string; wrapper: LibraryRuntime.EditedProcedure } | undefined>(
    undefined
  );
  const [subEntitySeed, setSubEntitySeed] = useState('');

  const mutableCollectionId = useMutableCollection(workspace.data.entities.decorations.collections, [
    workspace,
    reactiveWorkspace.version
  ]);

  const { entities: decorations, selectedId } = useEntityList<LibraryRuntime.IDecoration, DecorationId>({
    getAll: () => workspace.data.decorations.values(),
    compare: (a, b) => a.name.localeCompare(b.name),
    entityType: 'decoration',
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
    (id: DecorationId): void => {
      const entry: ICascadeEntry = { entityType: 'decoration', entityId: id, mode: 'view' };
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

  const getOrCreateWrapper = useCallback(
    (decoration: LibraryRuntime.IDecoration): LibraryRuntime.EditedDecoration | undefined => {
      const id = decoration.id;
      if (editingRef.current?.id === id) {
        return editingRef.current.wrapper;
      }
      const result = LibraryRuntime.EditedDecoration.create(decoration.entity);
      if (result.isFailure()) {
        return undefined;
      }
      editingRef.current = { id, wrapper: result.value };
      return result.value;
    },
    []
  );

  const handleEditDecoration = useCallback(
    (entityId: string): void => {
      const idx = cascadeStack.findIndex((e) => e.entityId === entityId && e.entityType === 'decoration');
      if (idx < 0) return;
      squashCascade([...cascadeStack.slice(0, idx), { ...cascadeStack[idx], mode: 'edit' as const }]);
    },
    [cascadeStack, squashCascade]
  );

  const handleCancelDecorationEdit = useCallback(
    (entityId: string): void => {
      if (editingRef.current?.id === entityId) {
        editingRef.current = undefined;
      }
      subIngredientRef.current = undefined;
      subProcedureRef.current = undefined;
      procedureSession.cleanup();
      const updated = cascadeStack.map((e) =>
        e.entityId === entityId && e.entityType === 'decoration' ? { ...e, mode: 'view' as const } : e
      );
      squashCascade(updated);
    },
    [cascadeStack, squashCascade, procedureSession]
  );

  const handleSaveDecorationAs = useCallback(
    (wrapper: LibraryRuntime.EditedDecoration): void => {
      workspace.data.logger.info(
        `Save to... requested for decoration '${wrapper.current.name}' — collection picker not yet implemented`
      );
    },
    [workspace]
  );

  const handleSaveDecoration = useCallback(
    (wrapper: LibraryRuntime.EditedDecoration): void => {
      const entity = wrapper.current;
      const compositeId = editingRef.current?.id;
      if (!compositeId) {
        workspace.data.logger.error('Save failed: no composite ID for decoration editing wrapper');
        return;
      }

      const validationResult = Editing.Decorations.Validators.validateDecorationEntity(entity);
      if (validationResult.isFailure()) {
        workspace.data.logger.error(`Save failed: ${validationResult.message}`);
        return;
      }

      const collectionId = compositeId.split('.')[0] as CollectionId;
      const baseId = entity.baseId as BaseDecorationId;

      const collectionEntry = workspace.data.entities.decorations.collections.get(collectionId);
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

      const editableResult = workspace.data.entities.getEditableDecorationsEntityCollection(collectionId);
      if (editableResult.isSuccess()) {
        const editable = editableResult.value;
        editable.set(baseId, entity);
        if (editable.canSave()) {
          const saveResult = editable.save();
          if (saveResult.isFailure()) {
            workspace.data.logger.error(`Disk save failed: ${saveResult.message}`);
          } else {
            workspace.data.logger.info(`Saved decoration '${entity.name}' to collection '${collectionId}'`);
          }
        } else {
          workspace.data.logger.info(
            `Updated decoration '${entity.name}' in-memory (collection '${collectionId}' has no backing file)`
          );
        }
      } else {
        workspace.data.logger.info(
          `Updated decoration '${entity.name}' in-memory only: ${editableResult.message}`
        );
      }

      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();

      if (editingRef.current?.id === compositeId) {
        editingRef.current = undefined;
      }
      subIngredientRef.current = undefined;
      subProcedureRef.current = undefined;
      procedureSession.cleanup();
      const updated = cascadeStack.map((e) =>
        e.entityId === compositeId && e.entityType === 'decoration' ? { ...e, mode: 'view' as const } : e
      );
      squashCascade(updated);
    },
    [workspace, reactiveWorkspace, cascadeStack, squashCascade, procedureSession]
  );

  // Create a new decoration from an entity, add to mutable collection, and open in edit mode
  const handleCreateDecoration = useCallback(
    (entity: Entities.Decorations.IDecorationEntity, source: 'manual' | 'ai'): void => {
      if (!mutableCollectionId) {
        workspace.data.logger.error('Cannot add decoration: no mutable collection available');
        return;
      }

      const baseId = entity.baseId as BaseDecorationId;
      const compositeId = `${mutableCollectionId}.${baseId}` as DecorationId;

      const existing = workspace.data.decorations.get(compositeId);
      if (existing.isSuccess()) {
        workspace.data.logger.error(`Decoration '${compositeId}' already exists`);
        return;
      }

      const colResult = workspace.data.entities.decorations.collections.get(mutableCollectionId);
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
        workspace.data.logger.error(`Failed to add decoration: ${setResult.message}`);
        return;
      }

      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();

      const wrapperResult = LibraryRuntime.EditedDecoration.create(entity);
      if (wrapperResult.isFailure()) {
        workspace.data.logger.error(`Failed to create editing wrapper: ${wrapperResult.message}`);
        return;
      }
      editingRef.current = { id: compositeId, wrapper: wrapperResult.value };

      if (source === 'ai') {
        workspace.data.logger.info(`Created decoration '${entity.name}' from AI-generated data`);
      }

      const entry: ICascadeEntry = { entityType: 'decoration', entityId: compositeId, mode: 'edit' };
      squashCascade([entry]);
    },
    [workspace, reactiveWorkspace, mutableCollectionId, squashCascade]
  );

  const handleNewDecoration = useCallback((): void => {
    const entry: ICascadeEntry = { entityType: 'decoration', entityId: '__new__', mode: 'create' };
    squashCascade([entry]);
  }, [squashCascade]);

  const handleCreateFormSubmit = useCallback(
    (entity: Entities.Decorations.IDecorationEntity, source: 'manual' | 'ai'): void => {
      handleCreateDecoration(entity, source);
    },
    [handleCreateDecoration]
  );

  const handleCreateFormCancel = useCallback((): void => {
    squashCascade([]);
  }, [squashCascade]);

  const handlePreviewDecoration = useCallback(
    (entityId: string): void => {
      const idx = cascadeStack.findIndex((e) => e.entityId === entityId && e.entityType === 'decoration');
      if (idx < 0) return;
      squashCascade([
        ...cascadeStack.slice(0, idx + 1),
        { entityType: 'decoration', entityId, mode: 'preview' }
      ]);
    },
    [cascadeStack, squashCascade]
  );

  // Sub-entity creation: open ingredient create form in cascade from decoration editor
  const handleCreateIngredientFromDecoration = useCallback(
    (seed: string): void => {
      const editIdx = cascadeStack.findIndex((e) => e.entityType === 'decoration' && e.mode === 'edit');
      if (editIdx < 0) return;
      setSubEntitySeed(seed);
      squashCascade([
        ...cascadeStack.slice(0, editIdx + 1),
        { entityType: 'ingredient', entityId: '__new__', mode: 'create' }
      ]);
    },
    [cascadeStack, squashCascade]
  );

  // Sub-entity creation: open procedure create form in cascade from decoration editor
  const handleCreateProcedureFromDecoration = useCallback(
    (seed: string): void => {
      const editIdx = cascadeStack.findIndex((e) => e.entityType === 'decoration' && e.mode === 'edit');
      if (editIdx < 0) return;
      setSubEntitySeed(seed);
      squashCascade([
        ...cascadeStack.slice(0, editIdx + 1),
        { entityType: 'procedure', entityId: '__new__', mode: 'create' }
      ]);
    },
    [cascadeStack, squashCascade]
  );

  // Paste ingredient from clipboard (AI-generated JSON)
  const handlePasteIngredientFromDecoration = useCallback((): void => {
    navigator.clipboard.readText().then(
      (text) => {
        if (!text.trim()) {
          workspace.data.logger.info('Clipboard is empty');
          return;
        }

        const stripped = text
          .trim()
          .replace(/^```(?:\w+)?\s*\n?([\s\S]*?)\n?\s*```$/, '$1')
          .trim();

        let parsed: unknown;
        try {
          parsed = JSON.parse(stripped);
        } catch (err: unknown) {
          const detail = err instanceof Error ? err.message : String(err);
          workspace.data.logger.error(`Clipboard does not contain valid JSON: ${detail}`);
          return;
        }

        const result = Entities.Ingredients.Converters.ingredientEntity.convert(parsed);
        if (result.isFailure()) {
          workspace.data.logger.error(`AI ingredient validation failed: ${result.message}`);
          return;
        }

        // Find a mutable ingredient collection
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

        const entity = result.value;
        const baseId = entity.baseId as BaseIngredientId;
        const compositeId = `${ingredientCollectionId}.${baseId}` as IngredientId;

        const existing = workspace.data.ingredients.get(compositeId);
        if (existing.isSuccess()) {
          workspace.data.logger.info(`Ingredient '${entity.name}' already exists — available for selection`);
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

        workspace.data.clearCache();
        reactiveWorkspace.notifyChange();
        workspace.data.logger.info(
          `Added ingredient '${entity.name}' from clipboard — now available for selection`
        );
      },
      () => {
        workspace.data.logger.error('Could not read clipboard — permission may be required');
      }
    );
  }, [workspace, reactiveWorkspace]);

  // Handle ingredient creation from sub-entity create form
  const handleSubEntityIngredientCreate = useCallback(
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

      // Open the new ingredient in edit mode (squashed after decoration editor)
      const wrapperResult = LibraryRuntime.EditedIngredient.create(entity);
      if (wrapperResult.isFailure()) {
        workspace.data.logger.error(`Failed to create ingredient editing wrapper: ${wrapperResult.message}`);
        return;
      }
      subIngredientRef.current = { id: compositeId, wrapper: wrapperResult.value };

      const editIdx = cascadeStack.findIndex((e) => e.entityType === 'decoration' && e.mode === 'edit');
      if (editIdx >= 0) {
        squashCascade([
          ...cascadeStack.slice(0, editIdx + 1),
          { entityType: 'ingredient', entityId: compositeId, mode: 'edit' }
        ]);
      }
    },
    [workspace, reactiveWorkspace, cascadeStack, squashCascade]
  );

  // Handle procedure creation from sub-entity create form
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

      // Open the new procedure in edit mode (squashed after decoration editor)
      const wrapperResult = LibraryRuntime.EditedProcedure.create(entity);
      if (wrapperResult.isFailure()) {
        workspace.data.logger.error(`Failed to create procedure editing wrapper: ${wrapperResult.message}`);
        return;
      }
      subProcedureRef.current = { id: compositeId, wrapper: wrapperResult.value };

      const editIdx = cascadeStack.findIndex((e) => e.entityType === 'decoration' && e.mode === 'edit');
      if (editIdx >= 0) {
        squashCascade([
          ...cascadeStack.slice(0, editIdx + 1),
          { entityType: 'procedure', entityId: compositeId, mode: 'edit' }
        ]);
      }
    },
    [workspace, reactiveWorkspace, cascadeStack, squashCascade]
  );

  // Cancel sub-entity creation — pop back to decoration editor
  const handleSubEntityCancel = useCallback((): void => {
    setSubEntitySeed('');
    const editIdx = cascadeStack.findIndex((e) => e.entityType === 'decoration' && e.mode === 'edit');
    if (editIdx >= 0) {
      squashCascade(cascadeStack.slice(0, editIdx + 1));
    } else {
      squashCascade([]);
    }
  }, [cascadeStack, squashCascade]);

  // Get or create an EditedIngredient wrapper for sub-entity editing
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

  // Get or create an EditedProcedure wrapper for sub-entity editing
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

  // Save a sub-entity ingredient and pop back to decoration editor
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

      const editIdx = cascadeStack.findIndex((e) => e.entityType === 'decoration' && e.mode === 'edit');
      if (editIdx >= 0) {
        squashCascade(cascadeStack.slice(0, editIdx + 1));
      }
    },
    [workspace, reactiveWorkspace, cascadeStack, squashCascade]
  );

  // Cancel sub-entity ingredient editing — pop back to decoration editor
  const handleSubIngredientCancel = useCallback((): void => {
    subIngredientRef.current = undefined;
    const editIdx = cascadeStack.findIndex((e) => e.entityType === 'decoration' && e.mode === 'edit');
    if (editIdx >= 0) {
      squashCascade(cascadeStack.slice(0, editIdx + 1));
    }
  }, [cascadeStack, squashCascade]);

  // Save a sub-entity procedure and pop back to decoration editor
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

      const editIdx = cascadeStack.findIndex((e) => e.entityType === 'decoration' && e.mode === 'edit');
      if (editIdx >= 0) {
        squashCascade(cascadeStack.slice(0, editIdx + 1));
      }
    },
    [workspace, reactiveWorkspace, cascadeStack, squashCascade, procedureSession]
  );

  // Cancel sub-entity procedure editing — pop back to decoration editor
  const handleSubProcedureCancel = useCallback((): void => {
    subProcedureRef.current = undefined;
    procedureSession.cleanup();
    const editIdx = cascadeStack.findIndex((e) => e.entityType === 'decoration' && e.mode === 'edit');
    if (editIdx >= 0) {
      squashCascade(cascadeStack.slice(0, editIdx + 1));
    }
  }, [cascadeStack, squashCascade, procedureSession]);

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

      if (entry.entityType === 'decoration') {
        // Create mode: render EntityCreateForm
        if (entry.mode === 'create') {
          return {
            key: '__new__',
            label: 'New Decoration',
            content: (
              <EntityCreateForm<Entities.Decorations.IDecorationEntity>
                slugify={slugify}
                buildPrompt={(name: string): string => name}
                convert={(from: unknown) => Entities.Decorations.Converters.decorationEntity.convert(from)}
                makeBlank={(name: string, id: string): Entities.Decorations.IDecorationEntity =>
                  createBlankDecorationEntity(id as BaseDecorationId, name)
                }
                onCreate={handleCreateFormSubmit}
                onCancel={handleCreateFormCancel}
                namePlaceholder="e.g. Gold Leaf Accent"
                entityLabel="Decoration"
              />
            )
          };
        }

        const result = workspace.data.decorations.get(entry.entityId as DecorationId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load decoration: {entry.entityId}</div>
          };
        }

        // Preview mode
        if (entry.mode === 'preview') {
          return {
            key: `${entry.entityId}:preview`,
            label: `Preview: ${result.value.name}`,
            content: (
              <DecorationPreviewPanel
                decoration={result.value}
                draftEntity={
                  editingRef.current?.id === entry.entityId ? editingRef.current.wrapper.current : undefined
                }
                availableIngredients={availableIngredients}
                availableProcedures={availableProcedures}
                onClose={(): void => popCascadeTo(index)}
              />
            )
          };
        }

        if (entry.mode === 'edit') {
          const wrapper = getOrCreateWrapper(result.value);
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
              <DecorationEditView
                wrapper={wrapper}
                availableIngredients={availableIngredients}
                availableProcedures={availableProcedures}
                onSave={handleSaveDecoration}
                onSaveAs={handleSaveDecorationAs}
                onCancel={(): void => handleCancelDecorationEdit(entry.entityId)}
                onMutate={undefined}
                onPreview={(): void => handlePreviewDecoration(entry.entityId)}
                onCreateIngredient={handleCreateIngredientFromDecoration}
                onCreateProcedure={handleCreateProcedureFromDecoration}
                onPasteIngredient={handlePasteIngredientFromDecoration}
              />
            )
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
              onEdit={(): void => handleEditDecoration(entry.entityId)}
              onPreview={(): void => handlePreviewDecoration(entry.entityId)}
            />
          )
        };
      }
      if (entry.entityType === 'ingredient') {
        // Sub-entity create mode for ingredients (from decoration editor)
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
        // Sub-entity create mode for procedures (from decoration editor)
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
                namePlaceholder="e.g. Gold Leaf Application"
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
    popCascadeTo,
    availableIngredients,
    availableProcedures,
    availableTasks,
    getOrCreateWrapper,
    getOrCreateSubIngredientWrapper,
    getOrCreateSubProcedureWrapper,
    handleEditDecoration,
    handleCancelDecorationEdit,
    handleSaveDecoration,
    handleSaveDecorationAs,
    handleCreateFormSubmit,
    handleCreateFormCancel,
    handlePreviewDecoration,
    handleCreateIngredientFromDecoration,
    handleCreateProcedureFromDecoration,
    handlePasteIngredientFromDecoration,
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
      const result = workspace.data.decorations.get(id as DecorationId);
      if (result.isFailure()) {
        return { key: id, label: id, content: <div className="p-4 text-red-500">Not found: {id}</div> };
      }
      return { key: id, label: result.value.name, content: <DecorationDetail decoration={result.value} /> };
    });
  }, [compareIds, workspace]);

  return (
    <EntityTabLayout
      list={
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
            <button
              onClick={handleNewDecoration}
              disabled={mutableCollectionId === undefined}
              title={mutableCollectionId === undefined ? 'No mutable collection available' : undefined}
              className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              + New Decoration
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <EntityList<LibraryRuntime.IDecoration, DecorationId>
              entities={useFilteredEntities(decorations, DECORATION_FILTER_SPEC)}
              descriptor={DECORATION_DESCRIPTOR}
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
                title: 'No Decorations',
                description: 'No decorations found in the library.'
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
    />
  );
}
