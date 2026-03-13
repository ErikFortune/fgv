import React, { useCallback, useMemo, useRef, useState } from 'react';
import { CursorArrowRaysIcon } from '@heroicons/react/20/solid';
import {
  ConfirmDialog,
  EntityList,
  type ICascadeColumn,
  EntityTabLayout,
  type IComparisonColumn
} from '@fgv/ts-app-shell';
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
import { fail } from '@fgv/ts-utils';
import {
  isDecorationCascadeEntry,
  isIngredientCascadeEntry,
  isProcedureCascadeEntry,
  CASCADE_NEW_ENTITY_ID,
  type IReferenceScanResult,
  useTabNavigation,
  useCascadeOps,
  useEntityList,
  useMutableCollection,
  useCanDeleteFromCollections,
  useEntityActions,
  createSetInMutableCollection,
  type MutableCollectionEntryWithSet,
  useEntityMutation,
  IngredientDetail,
  IngredientEditView,
  ProcedureDetail,
  ProcedureEditView,
  DecorationDetail,
  DecorationEditView,
  DecorationPreviewPanel,
  EntityCreateForm,
  getWritableCollectionOptions,
  useFilteredEntities,
  useClipboardJsonImport,
  useProcedureEditSession,
  useNavigationStore,
  ReadOnlyEditGate
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
    popCascadeTo,
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
  const cascade = useCascadeOps();

  const editingRef = useRef<{ id: DecorationId; wrapper: LibraryRuntime.EditedDecoration } | undefined>(
    undefined
  );
  const subIngredientRef = useRef<{ id: string; wrapper: LibraryRuntime.EditedIngredient } | undefined>(
    undefined
  );
  const subProcedureRef = useRef<{ id: string; wrapper: LibraryRuntime.EditedProcedure } | undefined>(
    undefined
  );
  const [subEntitySeed, setSubEntitySeed] = useState('');
  const [decorationToDelete, setDecorationToDelete] = useState<{
    id: DecorationId;
    name: string;
    references: IReferenceScanResult;
  } | null>(null);
  const entityActions = useEntityActions();
  const updateCascadeEntryChanges = useNavigationStore((s) => s.updateCascadeEntryChanges);

  const mutableCollectionId = useMutableCollection(
    workspace.data.entities.decorations.collections,
    [workspace, reactiveWorkspace.version],
    workspace.settings?.getResolvedSettings().defaultTargets.decorations
  );

  const ingredientMutableCollectionId = useMutableCollection(
    workspace.data.entities.ingredients.collections,
    [workspace, reactiveWorkspace.version],
    workspace.settings?.getResolvedSettings().defaultTargets.ingredients
  );

  const procedureMutableCollectionId = useMutableCollection(
    workspace.data.entities.procedures.collections,
    [workspace, reactiveWorkspace.version],
    workspace.settings?.getResolvedSettings().defaultTargets.procedures
  );

  const writableDecorationCollections = useMemo(
    (): ReadonlyArray<{ id: string; label?: string }> =>
      getWritableCollectionOptions(
        workspace.data.entities.decorations.collections.entries(),
        workspace.settings?.getResolvedSettings().defaultTargets.decorations
      ),
    [workspace, reactiveWorkspace.version]
  );

  const canDeleteDecoration = useCanDeleteFromCollections(workspace.data.entities.decorations.collections, [
    workspace,
    reactiveWorkspace.version
  ]);

  type DecorationCollectionResult = ReturnType<typeof workspace.data.entities.decorations.collections.get>;
  type DecorationCollectionEntry = Exclude<DecorationCollectionResult['value'], undefined>;

  type IngredientCollectionResult = ReturnType<typeof workspace.data.entities.ingredients.collections.get>;
  type IngredientCollectionEntry = Exclude<IngredientCollectionResult['value'], undefined>;
  type IngredientMutableCollectionEntry = MutableCollectionEntryWithSet<
    IngredientCollectionEntry,
    BaseIngredientId,
    Entities.Ingredients.IngredientEntity
  >;

  type ProcedureCollectionResult = ReturnType<typeof workspace.data.entities.procedures.collections.get>;
  type ProcedureCollectionEntry = Exclude<ProcedureCollectionResult['value'], undefined>;
  type ProcedureMutableCollectionEntry = MutableCollectionEntryWithSet<
    ProcedureCollectionEntry,
    BaseProcedureId,
    Entities.Procedures.IProcedureEntity
  >;

  const decorationMutation = useEntityMutation<
    Entities.Decorations.IDecorationEntity,
    BaseDecorationId,
    DecorationId
  >({
    setInMutableCollection: createSetInMutableCollection({
      getCollection: (collectionId: CollectionId) =>
        workspace.data.entities.decorations.collections.get(collectionId),
      isMutable: (entry: DecorationCollectionEntry): entry is DecorationCollectionEntry => entry.isMutable,
      setEntity: (
        entry: DecorationCollectionEntry,
        baseId: BaseDecorationId,
        entity: Entities.Decorations.IDecorationEntity
      ) => ('set' in entry.items ? entry.items.set(baseId, entity) : fail('Collection items are read-only')),
      entityLabel: 'decoration'
    }),
    entityLabel: 'decoration',
    getPersistedCollection: (collectionId: CollectionId) =>
      workspace.data.entities.getPersistedDecorationsCollection(collectionId)
  });

  const ingredientMutation = useEntityMutation<
    Entities.Ingredients.IngredientEntity,
    BaseIngredientId,
    IngredientId
  >({
    setInMutableCollection: createSetInMutableCollection<
      Entities.Ingredients.IngredientEntity,
      BaseIngredientId,
      IngredientCollectionEntry,
      IngredientMutableCollectionEntry
    >({
      getCollection: (collectionId: CollectionId) =>
        workspace.data.entities.ingredients.collections.get(collectionId),
      isMutable: (entry: IngredientCollectionEntry): entry is IngredientMutableCollectionEntry =>
        entry.isMutable && 'set' in entry.items,
      setEntity: (
        entry: IngredientMutableCollectionEntry,
        baseId: BaseIngredientId,
        entity: Entities.Ingredients.IngredientEntity
      ) => entry.items.set(baseId, entity),
      entityLabel: 'ingredient'
    }),
    entityLabel: 'ingredient',
    getPersistedCollection: (collectionId: CollectionId) =>
      workspace.data.entities.getPersistedIngredientsCollection(collectionId)
  });

  const procedureMutation = useEntityMutation<
    Entities.Procedures.IProcedureEntity,
    BaseProcedureId,
    ProcedureId
  >({
    setInMutableCollection: createSetInMutableCollection<
      Entities.Procedures.IProcedureEntity,
      BaseProcedureId,
      ProcedureCollectionEntry,
      ProcedureMutableCollectionEntry
    >({
      getCollection: (collectionId: CollectionId) =>
        workspace.data.entities.procedures.collections.get(collectionId),
      isMutable: (entry: ProcedureCollectionEntry): entry is ProcedureMutableCollectionEntry =>
        entry.isMutable && 'set' in entry.items,
      setEntity: (
        entry: ProcedureMutableCollectionEntry,
        baseId: BaseProcedureId,
        entity: Entities.Procedures.IProcedureEntity
      ) => entry.items.set(baseId, entity),
      entityLabel: 'procedure'
    }),
    entityLabel: 'procedure',
    getPersistedCollection: (collectionId: CollectionId) =>
      workspace.data.entities.getPersistedProceduresCollection(collectionId)
  });

  const { entities: decorations, selectedId } = useEntityList<LibraryRuntime.IDecoration, DecorationId>({
    getAll: () => workspace.data.decorations.values(),
    compare: (a, b) => a.name.localeCompare(b.name),
    entityType: 'decoration',
    cascadeStack: cascade.stack,
    deps: [workspace, reactiveWorkspace.version]
  });

  const decorationCreateSourceOptions = useMemo(
    (): ReadonlyArray<{ id: string; name: string }> =>
      decorations.map((decoration) => ({
        id: decoration.id,
        name: decoration.name
      })),
    [decorations]
  );

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
    slugify,
    onMutate: undefined
  });

  const handleSelect = useCallback(
    (id: DecorationId): void => {
      cascade.select({
        entityType: 'decoration',
        entityId: id,
        entity: workspace.data.decorations.get(id).report(workspace.data.logger).orDefault()
      });
    },
    [cascade, workspace]
  );

  const handleRequestDelete = useCallback(
    (id: DecorationId): void => {
      const result = workspace.data.decorations.get(id);
      const name = result.isSuccess() ? result.value.name : id;
      const references = entityActions.scanReferences(id);
      setDecorationToDelete({ id, name, references });
    },
    [workspace, entityActions]
  );

  const handleConfirmDelete = useCallback((): void => {
    if (decorationToDelete) {
      entityActions.deleteEntity(decorationToDelete.id).catch((err) => {
        workspace.data.logger.error(`Failed to delete decoration '${decorationToDelete.name}': ${err}`);
      });
      cascade.clearById(decorationToDelete.id);
    }
    setDecorationToDelete(null);
  }, [decorationToDelete, entityActions, cascade]);

  const handleCancelDelete = useCallback((): void => {
    setDecorationToDelete(null);
  }, []);

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
      cascade
        .find((e) => e.entityId === entityId && e.entityType === 'decoration')
        .onSuccess(({ depth }) => cascade.openEditor(depth));
    },
    [cascade]
  );

  const handleCancelDecorationEdit = useCallback(
    (entityId: string): void => {
      if (editingRef.current?.id === entityId) {
        editingRef.current = undefined;
      }
      subIngredientRef.current = undefined;
      subProcedureRef.current = undefined;
      procedureSession.cleanup();
      cascade
        .find((e) => e.entityId === entityId && e.entityType === 'decoration')
        .onSuccess(({ depth }) => cascade.popToView(depth));
    },
    [cascade, procedureSession]
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
    async (wrapper: LibraryRuntime.EditedDecoration): Promise<void> => {
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

      const baseId = entity.baseId as BaseDecorationId;

      const saveResult = await decorationMutation.saveEntity({
        compositeId,
        baseId,
        entity,
        persistToDisk: true
      });
      if (saveResult.isFailure()) {
        return;
      }

      if (editingRef.current?.id === compositeId) {
        editingRef.current = undefined;
      }
      subIngredientRef.current = undefined;
      subProcedureRef.current = undefined;
      procedureSession.cleanup();
      const refreshedEntity = workspace.data.decorations
        .get(compositeId as DecorationId)
        .report(workspace.data.logger)
        .orDefault();
      cascade
        .find((e) => e.entityId === compositeId && e.entityType === 'decoration')
        .onSuccess(({ depth }) => cascade.popToView(depth, refreshedEntity));
    },
    [workspace, decorationMutation, cascade, procedureSession]
  );

  // Create a new decoration from an entity, add to mutable collection, and open in edit mode
  const handleCreateDecoration = useCallback(
    async (
      entity: Entities.Decorations.IDecorationEntity,
      source: 'manual' | 'ai',
      targetCollectionId?: string
    ): Promise<void> => {
      const baseId = entity.baseId as BaseDecorationId;
      const createResult = await decorationMutation.createEntity({
        targetCollectionId: targetCollectionId as CollectionId | undefined,
        defaultCollectionId: mutableCollectionId,
        getCompositeId: (collectionId: CollectionId, nextBaseId: BaseDecorationId) =>
          `${collectionId}.${nextBaseId}` as DecorationId,
        baseId,
        entity,
        exists: (id: DecorationId) => workspace.data.decorations.get(id).isSuccess(),
        persistToDisk: false
      });
      if (createResult.isFailure()) {
        return;
      }

      const compositeId = createResult.value;

      const wrapperResult = LibraryRuntime.EditedDecoration.create(entity);
      if (wrapperResult.isFailure()) {
        workspace.data.logger.error(`Failed to create editing wrapper: ${wrapperResult.message}`);
        return;
      }
      editingRef.current = { id: compositeId, wrapper: wrapperResult.value };

      if (source === 'ai') {
        workspace.data.logger.info(`Created decoration '${entity.name}' from AI-generated data`);
      }

      cascade.select({
        entityType: 'decoration',
        entityId: compositeId,
        mode: 'edit',
        hasChanges: true,
        entity: workspace.data.decorations.get(compositeId).report(workspace.data.logger).orDefault()
      });
    },
    [workspace, mutableCollectionId, decorationMutation, cascade]
  );

  const handleCreateDecorationFromSource = useCallback(
    (params: {
      mode: 'copy' | 'derive';
      sourceId: string;
      name: string;
      id: string;
      targetCollectionId?: string;
    }): void => {
      const sourceResult = workspace.data.decorations.get(params.sourceId as DecorationId);
      if (sourceResult.isFailure()) {
        workspace.data.logger.error(`Cannot copy decoration '${params.sourceId}': not found`);
        return;
      }

      const nextEntity: Entities.Decorations.IDecorationEntity = {
        ...sourceResult.value.entity,
        baseId: params.id as BaseDecorationId,
        name: params.name as typeof sourceResult.value.entity.name
      };

      void handleCreateDecoration(nextEntity, 'manual', params.targetCollectionId);
    },
    [workspace, handleCreateDecoration]
  );

  const handleListHeaderPaste = useClipboardJsonImport<Entities.Decorations.IDecorationEntity>({
    entityLabel: 'decoration',
    convert: (from: unknown) => Entities.Decorations.Converters.decorationEntity.convert(from),
    onValid: (entity: Entities.Decorations.IDecorationEntity) => handleCreateDecoration(entity, 'ai'),
    onValidSuccessMessage: (entity: Entities.Decorations.IDecorationEntity) =>
      `Opened '${entity.name}' for review — save when ready`
  });

  const handleNewDecoration = useCallback((): void => {
    cascade.select({ entityType: 'decoration', entityId: CASCADE_NEW_ENTITY_ID, mode: 'create' });
  }, [cascade]);

  const handleCreateFormCancel = useCallback((): void => {
    cascade.clear();
  }, [cascade]);

  const handlePreviewDecoration = useCallback(
    (entityId: string): void => {
      cascade
        .find((e) => e.entityId === entityId && e.entityType === 'decoration')
        .onSuccess(({ depth }) =>
          cascade.openNested(depth, {
            entityType: 'decoration',
            entityId,
            mode: 'preview',
            entity: workspace.data.decorations
              .get(entityId as DecorationId)
              .report(workspace.data.logger)
              .orDefault()
          })
        );
    },
    [cascade, workspace]
  );

  // Sub-entity creation: open ingredient create form in cascade from decoration editor
  const handleCreateIngredientFromDecoration = useCallback(
    (seed: string): void => {
      cascade
        .find((e) => e.entityType === 'decoration' && e.mode === 'edit')
        .onSuccess(({ depth }) => {
          setSubEntitySeed(seed);
          return cascade.openNested(depth, {
            entityType: 'ingredient',
            entityId: CASCADE_NEW_ENTITY_ID,
            mode: 'create'
          });
        });
    },
    [cascade]
  );

  // Sub-entity creation: open procedure create form in cascade from decoration editor
  const handleCreateProcedureFromDecoration = useCallback(
    (seed: string): void => {
      cascade
        .find((e) => e.entityType === 'decoration' && e.mode === 'edit')
        .onSuccess(({ depth }) => {
          setSubEntitySeed(seed);
          return cascade.openNested(depth, {
            entityType: 'procedure',
            entityId: CASCADE_NEW_ENTITY_ID,
            mode: 'create'
          });
        });
    },
    [cascade]
  );

  // Paste ingredient from clipboard (AI-generated JSON)
  const handlePasteIngredientFromDecoration = useCallback((): void => {
    navigator.clipboard.readText().then(
      async (text) => {
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

        if (!ingredientMutableCollectionId) {
          workspace.data.logger.error('Cannot add ingredient: no mutable ingredient collection available');
          return;
        }

        const entity = result.value;
        const baseId = entity.baseId as BaseIngredientId;

        const createResult = await ingredientMutation.createEntity({
          targetCollectionId: ingredientMutableCollectionId,
          getCompositeId: (collectionId: CollectionId, nextBaseId: BaseIngredientId) =>
            `${collectionId}.${nextBaseId}` as IngredientId,
          baseId,
          entity,
          exists: (id: IngredientId) => workspace.data.ingredients.get(id).isSuccess(),
          persistToDisk: true
        });
        if (createResult.isSuccess()) {
          workspace.data.logger.info(
            `Added ingredient '${entity.name}' from clipboard — now available for selection`
          );
        }
      },
      () => {
        workspace.data.logger.error('Could not read clipboard — permission may be required');
      }
    );
  }, [workspace, ingredientMutation, ingredientMutableCollectionId]);

  // Handle ingredient creation from sub-entity create form
  const handleSubEntityIngredientCreate = useCallback(
    async (entity: Entities.Ingredients.IngredientEntity, _source: 'manual' | 'ai'): Promise<void> => {
      if (!ingredientMutableCollectionId) {
        workspace.data.logger.error('Cannot add ingredient: no mutable ingredient collection available');
        return;
      }

      const baseId = entity.baseId as BaseIngredientId;

      const createResult = await ingredientMutation.createEntity({
        targetCollectionId: ingredientMutableCollectionId,
        getCompositeId: (collectionId: CollectionId, nextBaseId: BaseIngredientId) =>
          `${collectionId}.${nextBaseId}` as IngredientId,
        baseId,
        entity,
        exists: (id: IngredientId) => workspace.data.ingredients.get(id).isSuccess(),
        persistToDisk: true
      });
      if (createResult.isFailure()) {
        return;
      }

      const compositeId = createResult.value;

      setSubEntitySeed('');

      // Open the new ingredient in edit mode (nested after decoration editor)
      LibraryRuntime.EditedIngredient.create(entity)
        .report(workspace.data.logger)
        .onSuccess((wrapper) => {
          subIngredientRef.current = { id: compositeId, wrapper };
          return cascade
            .find((e) => e.entityType === 'decoration' && e.mode === 'edit')
            .onSuccess(({ depth }) =>
              cascade.openNested(depth, {
                entityType: 'ingredient',
                entityId: compositeId,
                mode: 'edit',
                entity: workspace.data.ingredients.get(compositeId).report(workspace.data.logger).orDefault()
              })
            );
        });
    },
    [workspace, cascade, ingredientMutation, ingredientMutableCollectionId]
  );

  // Handle procedure creation from sub-entity create form
  const handleSubEntityProcedureCreate = useCallback(
    async (entity: Entities.Procedures.IProcedureEntity, _source: 'manual' | 'ai'): Promise<void> => {
      if (!procedureMutableCollectionId) {
        workspace.data.logger.error('Cannot add procedure: no mutable procedure collection available');
        return;
      }

      const baseId = entity.baseId as BaseProcedureId;

      const createResult = await procedureMutation.createEntity({
        targetCollectionId: procedureMutableCollectionId,
        getCompositeId: (collectionId: CollectionId, nextBaseId: BaseProcedureId) =>
          `${collectionId}.${nextBaseId}` as ProcedureId,
        baseId,
        entity,
        exists: (id: ProcedureId) => workspace.data.procedures.get(id).isSuccess(),
        persistToDisk: true
      });
      if (createResult.isFailure()) {
        return;
      }

      const compositeId = createResult.value;

      setSubEntitySeed('');

      // Open the new procedure in edit mode (nested after decoration editor)
      LibraryRuntime.EditedProcedure.create(entity)
        .report(workspace.data.logger)
        .onSuccess((wrapper) => {
          subProcedureRef.current = { id: compositeId, wrapper };
          return cascade
            .find((e) => e.entityType === 'decoration' && e.mode === 'edit')
            .onSuccess(({ depth }) =>
              cascade.openNested(depth, {
                entityType: 'procedure',
                entityId: compositeId,
                mode: 'edit',
                entity: workspace.data.procedures.get(compositeId).report(workspace.data.logger).orDefault()
              })
            );
        });
    },
    [workspace, cascade, procedureMutation, procedureMutableCollectionId]
  );

  // Cancel sub-entity creation — pop back to decoration editor
  const handleSubEntityCancel = useCallback((): void => {
    setSubEntitySeed('');
    cascade
      .find((e) => e.entityType === 'decoration' && e.mode === 'edit')
      .onSuccess(({ depth }) => cascade.trimTo(depth))
      .onFailure(() => {
        cascade.clear();
        return fail('no decoration editor found');
      });
  }, [cascade]);

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
    async (wrapper: LibraryRuntime.EditedIngredient): Promise<void> => {
      const entity = wrapper.current;
      const refId = subIngredientRef.current?.id;
      if (!refId) return;

      const compositeId = refId as IngredientId;
      const baseId = entity.baseId as BaseIngredientId;

      const saveResult = await ingredientMutation.saveEntity({
        compositeId,
        baseId,
        entity,
        persistToDisk: true
      });
      if (saveResult.isFailure()) {
        return;
      }

      subIngredientRef.current = undefined;

      cascade
        .find((e) => e.entityType === 'decoration' && e.mode === 'edit')
        .onSuccess(({ depth }) => cascade.trimTo(depth))
        .onFailure(() => cascade.pop());
    },
    [cascade, ingredientMutation]
  );

  // Cancel sub-entity ingredient editing — pop back to decoration editor
  const handleSubIngredientCancel = useCallback((): void => {
    subIngredientRef.current = undefined;
    cascade
      .find((e) => e.entityType === 'decoration' && e.mode === 'edit')
      .onSuccess(({ depth }) => cascade.trimTo(depth))
      .onFailure(() => cascade.pop());
  }, [cascade]);

  // Save a sub-entity procedure and pop back to decoration editor
  const handleSubProcedureSave = useCallback(
    async (wrapper: LibraryRuntime.EditedProcedure): Promise<void> => {
      const entity = wrapper.current;
      const refId = subProcedureRef.current?.id;
      if (!refId) return;

      const compositeId = refId as ProcedureId;
      const baseId = entity.baseId as BaseProcedureId;

      const saveResult = await procedureMutation.saveEntity({
        compositeId,
        baseId,
        entity,
        persistToDisk: true
      });
      if (saveResult.isFailure()) {
        return;
      }

      subProcedureRef.current = undefined;
      procedureSession.cleanup();

      cascade
        .find((e) => e.entityType === 'decoration' && e.mode === 'edit')
        .onSuccess(({ depth }) => cascade.trimTo(depth))
        .onFailure(() => cascade.pop());
    },
    [cascade, procedureMutation, procedureSession]
  );

  // Cancel sub-entity procedure editing — pop back to decoration editor
  const handleSubProcedureCancel = useCallback((): void => {
    subProcedureRef.current = undefined;
    procedureSession.cleanup();
    cascade
      .find((e) => e.entityType === 'decoration' && e.mode === 'edit')
      .onSuccess(({ depth }) => cascade.trimTo(depth))
      .onFailure(() => cascade.pop());
  }, [cascade, procedureSession]);

  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascade.stack.map((entry, index) => {
      const onIngredientClick = (id: IngredientId): void => {
        cascade.drillDown(index, {
          entityType: 'ingredient',
          entityId: id,
          entity: workspace.data.ingredients.get(id).report(workspace.data.logger).orDefault()
        });
      };
      const onProcedureClick = (id: ProcedureId): void => {
        cascade.drillDown(index, {
          entityType: 'procedure',
          entityId: id,
          entity: workspace.data.procedures.get(id).report(workspace.data.logger).orDefault()
        });
      };
      const onTaskClick = (id: TaskId): void => {
        cascade.drillDown(index, {
          entityType: 'task',
          entityId: id,
          entity: workspace.data.tasks.get(id).report(workspace.data.logger).orDefault()
        });
      };

      if (isDecorationCascadeEntry(entry)) {
        // Create mode: render EntityCreateForm
        if (entry.mode === 'create') {
          return {
            key: CASCADE_NEW_ENTITY_ID,
            label: 'New Decoration',
            content: (
              <EntityCreateForm<Entities.Decorations.IDecorationEntity>
                slugify={slugify}
                buildPrompt={AiAssist.buildDecorationAiPrompt}
                convert={(from: unknown) => Entities.Decorations.Converters.decorationEntity.convert(from)}
                makeBlank={(name: string, id: string): Entities.Decorations.IDecorationEntity =>
                  createBlankDecorationEntity(id as BaseDecorationId, name)
                }
                onCreate={handleCreateDecoration}
                sourceCreateMode="copy"
                sourceOptions={decorationCreateSourceOptions}
                onCreateFromSource={handleCreateDecorationFromSource}
                writableCollections={writableDecorationCollections}
                defaultTargetCollectionId={mutableCollectionId}
                onCancel={handleCreateFormCancel}
                namePlaceholder="e.g. Gold Leaf Accent"
                entityLabel="Decoration"
              />
            )
          };
        }

        const decoration = entry.entity;
        if (!decoration) {
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
            label: `Preview: ${decoration.name}`,
            content: (
              <DecorationPreviewPanel
                decoration={decoration}
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
          const wrapper = getOrCreateWrapper(decoration);
          if (!wrapper) {
            return {
              key: entry.entityId,
              label: decoration.name,
              content: <div className="p-4 text-red-500">Failed to create editing wrapper</div>
            };
          }
          const sourceCollectionId = (entry.entityId as string).split('.')[0] as CollectionId;
          const sourceColResult = workspace.data.entities.decorations.collections.get(sourceCollectionId);
          const isSourceReadOnly = sourceColResult.isSuccess() && !sourceColResult.value.isMutable;

          // Read-only source: show gate instead of full editor
          if (isSourceReadOnly) {
            return {
              key: `${entry.entityId}:edit`,
              label: decoration.name,
              content: (
                <ReadOnlyEditGate
                  entityName={decoration.name}
                  onSaveCopy={
                    mutableCollectionId
                      ? (): void => {
                          const today = new Date().toISOString().split('T')[0]!;
                          handleCreateDecorationFromSource({
                            mode: 'copy',
                            sourceId: entry.entityId,
                            name: decoration.name,
                            id: `${decoration.entity.baseId}-copy-${today}`
                          });
                        }
                      : undefined
                  }
                  onCancel={(): void => handleCancelDecorationEdit(entry.entityId)}
                />
              )
            };
          }

          return {
            key: `${entry.entityId}:edit`,
            label: `Editing: ${decoration.name}`,
            content: (
              <DecorationEditView
                wrapper={wrapper}
                availableIngredients={availableIngredients}
                availableProcedures={availableProcedures}
                onSave={handleSaveDecoration}
                onCancel={(): void => handleCancelDecorationEdit(entry.entityId)}
                onMutate={(): void => {
                  updateCascadeEntryChanges(entry.entityId, wrapper.hasChanges(wrapper.initial));
                }}
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
          label: decoration.name,
          content: (
            <DecorationDetail
              decoration={decoration}
              onIngredientClick={onIngredientClick}
              onProcedureClick={onProcedureClick}
              onEdit={(): void => handleEditDecoration(entry.entityId)}
              onPreview={(): void => handlePreviewDecoration(entry.entityId)}
            />
          )
        };
      }
      if (isIngredientCascadeEntry(entry)) {
        // Sub-entity create mode for ingredients (from decoration editor)
        if (entry.mode === 'create') {
          return {
            key: `${CASCADE_NEW_ENTITY_ID}_ingredient`,
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

        const ingredient = entry.entity;
        if (!ingredient) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load ingredient: {entry.entityId}</div>
          };
        }

        if (entry.mode === 'edit') {
          const wrapper = getOrCreateSubIngredientWrapper(ingredient);
          if (!wrapper) {
            return {
              key: entry.entityId,
              label: ingredient.name,
              content: <div className="p-4 text-red-500">Failed to create editing wrapper</div>
            };
          }
          return {
            key: `${entry.entityId}:edit`,
            label: `Editing: ${ingredient.name}`,
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
          label: ingredient.name,
          content: (
            <IngredientDetail
              ingredient={ingredient}
              onEdit={(): void => {
                cascade.openEditor(index);
              }}
              onClose={(): void => popCascadeTo(index)}
            />
          )
        };
      }
      if (isProcedureCascadeEntry(entry)) {
        // Sub-entity create mode for procedures (from decoration editor)
        if (entry.mode === 'create') {
          return {
            key: `${CASCADE_NEW_ENTITY_ID}_procedure`,
            label: 'New Procedure',
            content: (
              <EntityCreateForm<Entities.Procedures.IProcedureEntity>
                slugify={slugify}
                buildPrompt={AiAssist.buildProcedureAiPrompt}
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

        const procedure = entry.entity;
        if (!procedure) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load procedure: {entry.entityId}</div>
          };
        }

        if (entry.mode === 'edit') {
          const wrapper = getOrCreateSubProcedureWrapper(procedure);
          if (!wrapper) {
            return {
              key: entry.entityId,
              label: procedure.name,
              content: <div className="p-4 text-red-500">Failed to create editing wrapper</div>
            };
          }
          return {
            key: `${entry.entityId}:edit`,
            label: `Editing: ${procedure.name}`,
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
          label: procedure.name,
          content: (
            <ProcedureDetail
              procedure={procedure}
              onTaskClick={onTaskClick}
              onEdit={(): void => {
                cascade.openEditor(index);
              }}
              onClose={(): void => popCascadeTo(index)}
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
    cascade,
    workspace,
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
    handleCreateDecoration,
    handleCreateDecorationFromSource,
    decorationCreateSourceOptions,
    writableDecorationCollections,
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
    <>
      <ConfirmDialog
        isOpen={decorationToDelete !== null}
        title="Delete Decoration"
        message={
          <>
            Delete <strong>{decorationToDelete?.name}</strong>? This cannot be undone.
            {decorationToDelete?.references.hasReferences && (
              <>
                <br />
                <br />
                <span className="text-red-600 font-medium">Referenced by:</span>
                <ul className="mt-1 ml-4 list-disc text-sm">
                  {decorationToDelete.references.hits.map((hit) => (
                    <li key={hit.compositeId}>
                      <span className="capitalize">{hit.entityType}</span>:{' '}
                      <strong>{hit.displayName ?? hit.compositeId}</strong>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        }
        confirmLabel="Delete"
        severity="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
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
              <button
                onClick={handleListHeaderPaste}
                disabled={mutableCollectionId === undefined}
                title="Paste decoration from clipboard (JSON)"
                className="p-1.5 text-gray-500 hover:text-choco-primary hover:bg-gray-100 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CursorArrowRaysIcon className="w-5 h-5" />
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
                onDelete={handleRequestDelete}
                canDelete={canDeleteDecoration}
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
    </>
  );
}
