import React, { useCallback, useMemo, useRef, useState } from 'react';
import { CursorArrowRaysIcon } from '@heroicons/react/20/solid';
import {
  ConfirmDialog,
  EntityList,
  type ICascadeColumn,
  EntityTabLayout,
  type IComparisonColumn
} from '@fgv/ts-app-shell';
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
import type { Result, ResultMapValueType } from '@fgv/ts-utils';
import {
  type ICascadeEntry,
  type FillingSaveMode,
  type IReferenceScanResult,
  useTabNavigation,
  useEntityList,
  useMutableCollection,
  useCanDeleteFromCollections,
  useEntityActions,
  createSetInMutableCollection,
  type MutableCollectionEntryWithSet,
  useEntityMutation,
  IngredientDetail,
  IngredientEditView,
  FillingDetail,
  FillingEditView,
  FillingPreviewPanel,
  ProcedureDetail,
  ProcedureEditView,
  TaskDetail,
  EntityCreateForm,
  getWritableCollectionOptions,
  useFilteredEntities,
  useClipboardJsonImport,
  useCascadeDrillDown,
  useSquashAt,
  useProcedureEditSession,
  useNavigationStore
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
  readonly id: FillingId;
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
  const subIngredientRef = useRef<{ id: IngredientId; wrapper: LibraryRuntime.EditedIngredient } | undefined>(
    undefined
  );
  const subProcedureRef = useRef<{ id: ProcedureId; wrapper: LibraryRuntime.EditedProcedure } | undefined>(
    undefined
  );
  const [subEntitySeed, setSubEntitySeed] = useState('');
  const [fillingToDelete, setFillingToDelete] = useState<{
    id: FillingId;
    name: string;
    references: IReferenceScanResult;
  } | null>(null);
  const entityActions = useEntityActions();
  const updateCascadeEntryChanges = useNavigationStore((s) => s.updateCascadeEntryChanges);

  const mutableCollectionId = useMutableCollection(
    workspace.data.entities.fillings.collections,
    [workspace, reactiveWorkspace.version],
    workspace.settings?.getResolvedSettings().defaultTargets.fillings
  );

  const writableFillingCollections = useMemo(
    (): ReadonlyArray<{ id: string; label?: string }> =>
      getWritableCollectionOptions(
        workspace.data.entities.fillings.collections.entries(),
        workspace.settings?.getResolvedSettings().defaultTargets.fillings
      ),
    [workspace, reactiveWorkspace.version]
  );

  const canDeleteFilling = useCanDeleteFromCollections(workspace.data.entities.fillings.collections, [
    workspace,
    reactiveWorkspace.version
  ]);

  type FillingCollectionEntry = ResultMapValueType<typeof workspace.data.entities.fillings.collections>;
  type FillingMutableCollectionEntry = MutableCollectionEntryWithSet<
    FillingCollectionEntry,
    BaseFillingId,
    Entities.Fillings.IFillingRecipeEntity
  >;

  type IngredientCollectionEntry = ResultMapValueType<typeof workspace.data.entities.ingredients.collections>;
  type IngredientMutableCollectionEntry = MutableCollectionEntryWithSet<
    IngredientCollectionEntry,
    BaseIngredientId,
    Entities.Ingredients.IngredientEntity
  >;

  type ProcedureCollectionEntry = ResultMapValueType<typeof workspace.data.entities.procedures.collections>;
  type ProcedureMutableCollectionEntry = MutableCollectionEntryWithSet<
    ProcedureCollectionEntry,
    BaseProcedureId,
    Entities.Procedures.IProcedureEntity
  >;

  const fillingMutation = useEntityMutation<Entities.Fillings.IFillingRecipeEntity, BaseFillingId, FillingId>(
    {
      setInMutableCollection: createSetInMutableCollection<
        Entities.Fillings.IFillingRecipeEntity,
        BaseFillingId,
        FillingCollectionEntry,
        FillingMutableCollectionEntry
      >({
        getCollection: (collectionId: CollectionId) =>
          workspace.data.entities.fillings.collections.get(collectionId),
        isMutable: (entry: FillingCollectionEntry): entry is FillingMutableCollectionEntry =>
          entry.isMutable && 'set' in entry.items,
        setEntity: (
          entry: FillingMutableCollectionEntry,
          baseId: BaseFillingId,
          entity: Entities.Fillings.IFillingRecipeEntity
        ) => entry.items.set(baseId, entity),
        entityLabel: 'filling'
      }),
      entityLabel: 'filling',
      getEditableCollection: (collectionId: CollectionId) =>
        workspace.data.entities.getEditableFillingsRecipeEntityCollection(collectionId, workspace.keyStore)
    }
  );

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
    getEditableCollection: (collectionId: CollectionId) =>
      workspace.data.entities.getEditableIngredientsEntityCollection(collectionId, workspace.keyStore)
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
    getEditableCollection: (collectionId: CollectionId) =>
      workspace.data.entities.getEditableProceduresEntityCollection(collectionId, workspace.keyStore)
  });

  // --------------------------------------------------------------------------
  // Start Session — navigate to sessions tab with pre-filled cascade
  // --------------------------------------------------------------------------

  const handleRequestStartSession = useCallback(
    (fillingId: FillingId, variationSpec: FillingRecipeVariationSpec): void => {
      const result = workspace.data.fillings.get(fillingId);
      const entityName = result.isSuccess() ? result.value.name : fillingId;
      const store = useNavigationStore.getState();
      store.setMode('production');
      store.setTab('sessions');
      store.squashCascade([
        {
          entityType: 'session',
          entityId: '__new__',
          mode: 'create',
          createSessionInfo: { fillingId, variationSpec, entityName }
        }
      ]);
    },
    [workspace]
  );

  const { entities: fillings, selectedId } = useEntityList<LibraryRuntime.FillingRecipe, FillingId>({
    getAll: () => workspace.data.fillings.values(),
    compare: (a, b) => a.name.localeCompare(b.name),
    entityType: 'filling',
    cascadeStack,
    deps: [workspace, reactiveWorkspace.version]
  });

  const fillingCreateSourceOptions = useMemo(
    (): ReadonlyArray<{ id: string; name: string }> =>
      fillings.map((filling) => ({
        id: filling.id,
        name: filling.name
      })),
    [fillings]
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

  const handleRequestDelete = useCallback(
    (id: FillingId): void => {
      const result = workspace.data.fillings.get(id);
      const name = result.isSuccess() ? result.value.name : id;
      const references = entityActions.scanReferences(id);
      setFillingToDelete({ id, name, references });
    },
    [workspace, entityActions]
  );

  const handleConfirmDelete = useCallback((): void => {
    if (fillingToDelete) {
      entityActions.deleteEntity(fillingToDelete.id);
      if (cascadeStack.some((e) => e.entityId === fillingToDelete.id)) {
        squashCascade([]);
      }
    }
    setFillingToDelete(null);
  }, [fillingToDelete, entityActions, cascadeStack, squashCascade]);

  const handleCancelDelete = useCallback((): void => {
    setFillingToDelete(null);
  }, []);

  const squashAt = useSquashAt(cascadeStack, squashCascade);

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
    async (mode: FillingSaveMode): Promise<void> => {
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
          name: `${originalEntity.name}${
            workspace.settings?.getResolvedSettings()?.workflow?.adaptedRecipeNameSuffix ?? ' (adapted)'
          }` as typeof originalEntity.name,
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

        const createResult = await fillingMutation.createEntity({
          targetCollectionId: mutableCollectionId,
          getCompositeId: (collectionId: CollectionId, nextBaseId: BaseFillingId) =>
            `${collectionId}.${nextBaseId}` as FillingId,
          baseId: newBaseId,
          entity: newEntity,
          exists: (id: FillingId) => workspace.data.fillings.get(id).isSuccess(),
          persistToDisk: true
        });
        if (createResult.isFailure()) {
          return;
        }
        workspace.data.logger.info(`Created new recipe '${newEntity.name}' from '${originalEntity.name}'`);

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
      const baseId = entity.baseId as BaseFillingId;

      const saveResult = await fillingMutation.saveEntity({
        compositeId,
        baseId,
        entity,
        persistToDisk: true
      });
      if (saveResult.isFailure()) {
        return;
      }

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
    [workspace, cascadeStack, squashCascade, procedureSession, mutableCollectionId, fillingMutation]
  );

  // ============================================================================
  // Create Flow
  // ============================================================================

  const handleNewFilling = useCallback((): void => {
    const entry: ICascadeEntry = { entityType: 'filling', entityId: '__new__', mode: 'create' };
    squashCascade([entry]);
  }, [squashCascade]);

  const handleCreateFilling = useCallback(
    async (
      entity: Entities.Fillings.IFillingRecipeEntity,
      source: 'manual' | 'ai',
      targetCollectionId?: string
    ): Promise<void> => {
      const baseId = entity.baseId as BaseFillingId;
      const createResult = await fillingMutation.createEntity({
        targetCollectionId: targetCollectionId as CollectionId | undefined,
        defaultCollectionId: mutableCollectionId,
        getCompositeId: (collectionId: CollectionId, nextBaseId: BaseFillingId) =>
          `${collectionId}.${nextBaseId}` as FillingId,
        baseId,
        entity,
        exists: (id: FillingId) => workspace.data.fillings.get(id).isSuccess(),
        persistToDisk: false
      });
      if (createResult.isFailure()) {
        return;
      }

      const compositeId = createResult.value;

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
    [workspace, mutableCollectionId, fillingMutation, squashCascade]
  );

  const handleCreateFillingFromSource = useCallback(
    (params: {
      mode: 'copy' | 'derive';
      sourceId: string;
      name: string;
      id: string;
      targetCollectionId?: string;
    }): void => {
      const sourceResult = workspace.data.fillings.get(params.sourceId as FillingId);
      if (sourceResult.isFailure()) {
        workspace.data.logger.error(`Cannot ${params.mode} filling '${params.sourceId}': not found`);
        return;
      }

      const source = sourceResult.value;
      const today = new Date().toISOString().split('T')[0] ?? '';
      const sourceVariationId = Helpers.createFillingRecipeVariationId(source.id, source.goldenVariationSpec);

      const nextEntity: Entities.Fillings.IFillingRecipeEntity = {
        ...source.entity,
        baseId: params.id as BaseFillingId,
        name: params.name as typeof source.entity.name,
        derivedFrom:
          params.mode === 'derive'
            ? {
                sourceVariationId,
                derivedDate: today
              }
            : source.entity.derivedFrom
      };

      void handleCreateFilling(nextEntity, 'manual', params.targetCollectionId);
    },
    [workspace, handleCreateFilling]
  );

  const handleCreateFormCancel = useCallback((): void => {
    squashCascade([]);
  }, [squashCascade]);

  const handleListHeaderPaste = useClipboardJsonImport<Entities.Fillings.IFillingRecipeEntity>({
    entityLabel: 'filling',
    convert: (from: unknown) => Entities.Fillings.Converters.fillingRecipeEntity.convert(from),
    onValid: (entity: Entities.Fillings.IFillingRecipeEntity) => handleCreateFilling(entity, 'ai'),
    onValidSuccessMessage: (entity: Entities.Fillings.IFillingRecipeEntity) =>
      `Opened '${entity.name}' for review — save when ready`
  });

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
    async (entity: Entities.Ingredients.IngredientEntity, __source: 'manual' | 'ai'): Promise<void> => {
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

      const createResult = await ingredientMutation.createEntity({
        targetCollectionId: ingredientCollectionId,
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
    [workspace, cascadeStack, squashCascade, ingredientMutation]
  );

  const handleSubEntityProcedureCreate = useCallback(
    async (entity: Entities.Procedures.IProcedureEntity, __source: 'manual' | 'ai'): Promise<void> => {
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

      const createResult = await procedureMutation.createEntity({
        targetCollectionId: procedureCollectionId,
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
    [workspace, cascadeStack, squashCascade, procedureMutation]
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
    async (wrapper: LibraryRuntime.EditedIngredient): Promise<void> => {
      const entity = wrapper.current;
      const compositeId = subIngredientRef.current?.id;
      if (!compositeId) return;

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
    async (wrapper: LibraryRuntime.EditedProcedure): Promise<void> => {
      const entity = wrapper.current;
      const compositeId = subProcedureRef.current?.id;
      if (!compositeId) return;

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

      const editIdx = cascadeStack.findIndex((e) => e.entityType === 'filling' && e.mode === 'edit');
      if (editIdx >= 0) {
        squashCascade(cascadeStack.slice(0, editIdx + 1));
      }
    },
    [cascadeStack, squashCascade, procedureSession, procedureMutation]
  );

  const handleSubProcedureCancel = useCallback((): void => {
    subProcedureRef.current = undefined;
    procedureSession.cleanup();
    const editIdx = cascadeStack.findIndex((e) => e.entityType === 'filling' && e.mode === 'edit');
    if (editIdx >= 0) {
      squashCascade(cascadeStack.slice(0, editIdx + 1));
    }
  }, [cascadeStack, squashCascade, procedureSession]);

  const drillDown = useCascadeDrillDown(cascadeStack, squashCascade, squashAt);

  // ============================================================================
  // Cascade Columns
  // ============================================================================

  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascadeStack.map((entry, index) => {
      const onIngredientClick = (id: IngredientId): void => drillDown(index, 'ingredient', id);
      const onProcedureClick = (id: ProcedureId): void => drillDown(index, 'procedure', id);
      const onTaskClick = (id: TaskId): void => drillDown(index, 'task', id);

      if (entry.entityType === 'filling') {
        // Create mode
        if (entry.mode === 'create') {
          return {
            key: '__new__',
            label: 'New Filling',
            content: (
              <EntityCreateForm<Entities.Fillings.IFillingRecipeEntity>
                slugify={slugify}
                buildPrompt={AiAssist.buildFillingAiPrompt}
                convert={(from: unknown) => Entities.Fillings.Converters.fillingRecipeEntity.convert(from)}
                makeBlank={(name: string, id: string): Entities.Fillings.IFillingRecipeEntity =>
                  createBlankFillingRecipeEntity(id as BaseFillingId, name)
                }
                onCreate={handleCreateFilling}
                sourceCreateMode="derive"
                sourceOptions={fillingCreateSourceOptions}
                onCreateFromSource={handleCreateFillingFromSource}
                writableCollections={writableFillingCollections}
                defaultTargetCollectionId={mutableCollectionId}
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
          const sourceCollectionId = (state.id as string).split('.')[0] as CollectionId;
          const sourceColResult = workspace.data.entities.fillings.collections.get(sourceCollectionId);
          const isSourceReadOnly = sourceColResult.isSuccess() && !sourceColResult.value.isMutable;
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
                readOnly={isSourceReadOnly}
                onSave={handleSaveFilling}
                onCancel={(): void => handleCancelFillingEdit(entry.entityId)}
                onPreview={(): void => handlePreviewFilling(entry.entityId)}
                onCreateIngredient={handleCreateIngredientFromFilling}
                onCreateProcedure={handleCreateProcedureFromFilling}
                onMutation={(): void => {
                  updateCascadeEntryChanges(entry.entityId, state.wrapper.hasChanges(state.wrapper.initial));
                }}
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
              onStartSession={(spec): void => handleRequestStartSession(fillingId, spec)}
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
              onClose={(): void => popCascadeTo(index)}
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
                buildPrompt={AiAssist.buildProcedureAiPrompt}
                convert={(from: unknown) => Entities.Procedures.Converters.procedureEntity.convert(from)}
                makeBlank={(name: string, id: string): Entities.Procedures.IProcedureEntity =>
                  createBlankRawProcedureEntity(id as BaseProcedureId, name)
                }
                initialName={subEntitySeed}
                onCreate={handleSubEntityProcedureCreate}
                onCancel={handleSubEntityCancel}
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
              onClose={(): void => popCascadeTo(index)}
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
    handleCreateFillingFromSource,
    handleCreateFormCancel,
    fillingCreateSourceOptions,
    writableFillingCollections,
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
    subEntitySeed,
    handleRequestStartSession
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
    <>
      <ConfirmDialog
        isOpen={fillingToDelete !== null}
        title="Delete Filling"
        message={
          <>
            Delete <strong>{fillingToDelete?.name}</strong>? This cannot be undone.
            {fillingToDelete?.references.hasReferences && (
              <>
                <br />
                <br />
                <span className="text-red-600 font-medium">Referenced by:</span>
                <ul className="mt-1 ml-4 list-disc text-sm">
                  {fillingToDelete.references.hits.map((hit) => (
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
                onClick={handleNewFilling}
                disabled={mutableCollectionId === undefined}
                title={mutableCollectionId === undefined ? 'No mutable collection available' : undefined}
                className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                + New Filling
              </button>
              <button
                onClick={handleListHeaderPaste}
                disabled={mutableCollectionId === undefined}
                title="Paste filling from clipboard (JSON)"
                className="p-1.5 text-gray-500 hover:text-choco-primary hover:bg-gray-100 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CursorArrowRaysIcon className="w-5 h-5" />
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
                onDelete={handleRequestDelete}
                canDelete={canDeleteFilling}
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
    </>
  );
}
