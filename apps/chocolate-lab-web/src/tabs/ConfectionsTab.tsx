import React, { useCallback, useMemo, useRef, useState } from 'react';
import { CursorArrowRaysIcon } from '@heroicons/react/20/solid';
import {
  ConfirmDialog,
  EntityList,
  type ICascadeColumn,
  EntityTabLayout,
  type IComparisonColumn
} from '@fgv/ts-app-shell';
import { AiAssist, Entities, Helpers, LibraryRuntime } from '@fgv/ts-chocolate';
import { AiAssist as ExtrasAiAssist } from '@fgv/ts-extras';
import type {
  BaseConfectionId,
  BaseDecorationId,
  BaseFillingId,
  BaseIngredientId,
  BaseMoldId,
  BaseProcedureId,
  CollectionId,
  ConfectionRecipeVariationSpec,
  ConfectionName,
  ConfectionType,
  IngredientId,
  FillingId,
  MoldId,
  TaskId,
  ProcedureId,
  ConfectionId,
  DecorationId
} from '@fgv/ts-chocolate';
import { fail } from '@fgv/ts-utils';
import type { ResultMapValueType } from '@fgv/ts-utils';
import {
  type CascadeEntityType,
  type IReferenceScanResult,
  isConfectionCascadeEntry,
  isFillingCascadeEntry,
  isIngredientCascadeEntry,
  isMoldCascadeEntry,
  isDecorationCascadeEntry,
  isProcedureCascadeEntry,
  isTaskCascadeEntry,
  CASCADE_NEW_ENTITY_ID,
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
  FillingSaveMode,
  MoldDetail,
  MoldEditView,
  ProcedureDetail,
  ProcedureEditView,
  TaskDetail,
  ConfectionDetail,
  ConfectionEditView,
  type ConfectionSaveMode,
  ConfectionPreviewPanel,
  DecorationDetail,
  DecorationEditView,
  useFilteredEntities,
  EntityCreateForm,
  getWritableCollectionOptions,
  type IConfectionViewSettings,
  useClipboardJsonImport,
  useCascadeOps,
  useNavigationStore,
  ReadOnlyEditGate
} from '@fgv/chocolate-lab-ui';

import {
  CONFECTION_DESCRIPTOR,
  CONFECTION_FILTER_SPEC,
  slugify,
  createBlankIngredientEntity,
  createBlankRawProcedureEntity,
  createBlankFillingRecipeEntity,
  createBlankMoldEntity,
  createBlankDecorationEntity
} from '../shared';

// ============================================================================
// Confection Type Labels
// ============================================================================

const CONFECTION_TYPE_LABELS: ReadonlyArray<{ readonly type: ConfectionType; readonly label: string }> = [
  { type: 'molded-bonbon', label: 'Molded Bon Bon' },
  { type: 'bar-truffle', label: 'Bar Truffle' },
  { type: 'rolled-truffle', label: 'Rolled Truffle' }
];

function createBlankConfectionEntity(
  name: string,
  id: string,
  confectionType: ConfectionType
): Entities.Confections.AnyConfectionRecipeEntity {
  const today = new Date().toISOString().split('T')[0] ?? '';
  const variationSpec = Helpers.generateConfectionVariationSpec([], { date: today }).orThrow();

  const base = {
    baseId: id as BaseConfectionId,
    name: name as ConfectionName,
    goldenVariationSpec: variationSpec
  };

  const baseVariation = {
    variationSpec,
    createdDate: today
  };

  switch (confectionType) {
    case 'molded-bonbon':
      return {
        ...base,
        confectionType: 'molded-bonbon',
        variations: [
          {
            ...baseVariation,
            yield: Entities.Confections.Converters.yieldInFrames.convert({ numFrames: 1 }).orThrow(),
            molds: { options: [] },
            shellChocolate: { ids: [] }
          }
        ]
      };
    case 'bar-truffle':
      return {
        ...base,
        confectionType: 'bar-truffle',
        variations: [
          {
            ...baseVariation,
            yield: Entities.Confections.Converters.barTruffleYield
              .convert({
                numPieces: 48,
                weightPerPiece: 10,
                dimensions: { width: 25, height: 25, depth: 16 }
              })
              .orThrow()
          }
        ]
      };
    case 'rolled-truffle':
      return {
        ...base,
        confectionType: 'rolled-truffle',
        variations: [
          {
            ...baseVariation,
            yield: Entities.Confections.Converters.yieldInPieces
              .convert({ numPieces: 40, weightPerPiece: 15 })
              .orThrow()
          }
        ]
      };
  }
}

// ============================================================================
// Confection Create Panel (wraps EntityCreateForm with type selector)
// ============================================================================

function ConfectionCreatePanel(props: {
  readonly onCreateConfection: (
    entity: Entities.Confections.AnyConfectionRecipeEntity,
    source: 'manual' | 'ai',
    targetCollectionId?: string
  ) => void;
  readonly onCancel: () => void;
  readonly sourceOptions: ReadonlyArray<{ id: string; name: string }>;
  readonly onCreateFromSource: (params: {
    mode: 'copy' | 'derive';
    sourceId: string;
    name: string;
    id: string;
    targetCollectionId?: string;
  }) => void;
  readonly writableCollections: ReadonlyArray<{ id: string; label?: string }>;
  readonly defaultTargetCollectionId: CollectionId | undefined;
}): React.ReactElement {
  const {
    onCreateConfection,
    onCancel,
    sourceOptions,
    onCreateFromSource,
    writableCollections,
    defaultTargetCollectionId
  } = props;
  const [confectionType, setConfectionType] = useState<ConfectionType>('rolled-truffle');

  return (
    <div className="flex flex-col">
      {/* Confection type selector */}
      <div className="px-4 pt-4">
        <label className="text-sm font-medium text-gray-700">Confection Type</label>
        <select
          value={confectionType}
          onChange={(e): void => setConfectionType(e.target.value as ConfectionType)}
          className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary"
        >
          {CONFECTION_TYPE_LABELS.map((ct) => (
            <option key={ct.type} value={ct.type}>
              {ct.label}
            </option>
          ))}
        </select>
      </div>

      <EntityCreateForm<Entities.Confections.AnyConfectionRecipeEntity>
        slugify={slugify}
        buildPrompt={(name: string): ExtrasAiAssist.AiPrompt => {
          const user = `Generate a JSON object representing the chocolate confection recipe "${name}".`;
          const system = `Return ONLY valid JSON (no markdown). Use confectionType "${confectionType}" with at least one variation and set goldenVariationSpec to that variationSpec.`;
          return new ExtrasAiAssist.AiPrompt(user, system);
        }}
        convert={(from: unknown) => Entities.Confections.Converters.anyConfectionEntity.convert(from)}
        makeBlank={(name: string, id: string): Entities.Confections.AnyConfectionRecipeEntity =>
          createBlankConfectionEntity(name, id, confectionType)
        }
        onCreate={onCreateConfection}
        sourceCreateMode="derive"
        sourceOptions={sourceOptions}
        onCreateFromSource={onCreateFromSource}
        writableCollections={writableCollections}
        defaultTargetCollectionId={defaultTargetCollectionId}
        onCancel={onCancel}
        namePlaceholder="e.g. Classic Dark Dome"
        entityLabel="Confection"
      />
    </div>
  );
}

// ============================================================================
// Confection Editing State
// ============================================================================

interface IConfectionEditingState {
  readonly id: ConfectionId;
  readonly wrapper: LibraryRuntime.EditedConfectionRecipe;
  selectedVariationSpec: ConfectionRecipeVariationSpec;
}

export function ConfectionsTabContent(): React.ReactElement {
  const cascade = useCascadeOps();
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
  const [variationCompare, setVariationCompare] = useState<
    { id: ConfectionId; specs: ReadonlyArray<string> } | undefined
  >(undefined);

  const mutableCollectionId = useMutableCollection(
    workspace.data.entities.confections.collections,
    [workspace, reactiveWorkspace.version],
    workspace.settings?.getResolvedSettings().defaultTargets.confections
  );

  const writableConfectionCollections = useMemo(
    (): ReadonlyArray<{ id: string; label?: string }> =>
      getWritableCollectionOptions(
        workspace.data.entities.confections.collections.entries(),
        workspace.settings?.getResolvedSettings().defaultTargets.confections
      ),
    [workspace, reactiveWorkspace.version]
  );

  const canDeleteConfection = useCanDeleteFromCollections(workspace.data.entities.confections.collections, [
    workspace,
    reactiveWorkspace.version
  ]);

  type ConfectionCollectionEntry = ResultMapValueType<typeof workspace.data.entities.confections.collections>;
  type ConfectionMutableCollectionEntry = MutableCollectionEntryWithSet<
    ConfectionCollectionEntry,
    BaseConfectionId,
    Entities.Confections.AnyConfectionRecipeEntity
  >;

  type IngredientCollectionEntry = ResultMapValueType<typeof workspace.data.entities.ingredients.collections>;
  type IngredientMutableCollectionEntry = MutableCollectionEntryWithSet<
    IngredientCollectionEntry,
    BaseIngredientId,
    Entities.Ingredients.IngredientEntity
  >;

  type FillingCollectionEntry = ResultMapValueType<typeof workspace.data.entities.fillings.collections>;
  type FillingMutableCollectionEntry = MutableCollectionEntryWithSet<
    FillingCollectionEntry,
    BaseFillingId,
    Entities.Fillings.IFillingRecipeEntity
  >;

  type ProcedureCollectionEntry = ResultMapValueType<typeof workspace.data.entities.procedures.collections>;
  type ProcedureMutableCollectionEntry = MutableCollectionEntryWithSet<
    ProcedureCollectionEntry,
    BaseProcedureId,
    Entities.Procedures.IProcedureEntity
  >;

  type MoldCollectionResult = ReturnType<typeof workspace.data.entities.molds.collections.get>;
  type MoldCollectionEntry = Exclude<MoldCollectionResult['value'], undefined>;

  type DecorationCollectionResult = ReturnType<typeof workspace.data.entities.decorations.collections.get>;
  type DecorationCollectionEntry = Exclude<DecorationCollectionResult['value'], undefined>;

  const confectionMutation = useEntityMutation<
    Entities.Confections.AnyConfectionRecipeEntity,
    BaseConfectionId,
    ConfectionId
  >({
    setInMutableCollection: createSetInMutableCollection<
      Entities.Confections.AnyConfectionRecipeEntity,
      BaseConfectionId,
      ConfectionCollectionEntry,
      ConfectionMutableCollectionEntry
    >({
      getCollection: (collectionId: CollectionId) =>
        workspace.data.entities.confections.collections.get(collectionId),
      isMutable: (entry: ConfectionCollectionEntry): entry is ConfectionMutableCollectionEntry =>
        entry.isMutable && 'set' in entry.items,
      setEntity: (
        entry: ConfectionMutableCollectionEntry,
        baseId: BaseConfectionId,
        entity: Entities.Confections.AnyConfectionRecipeEntity
      ) => entry.items.set(baseId, entity),
      entityLabel: 'confection'
    }),
    entityLabel: 'confection',
    getPersistedCollection: (collectionId: CollectionId) =>
      workspace.data.entities.getPersistedConfectionsCollection(collectionId)
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
      getPersistedCollection: (collectionId: CollectionId) =>
        workspace.data.entities.getPersistedFillingsCollection(collectionId)
    }
  );

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

  const moldMutation = useEntityMutation<Entities.Molds.IMoldEntity, BaseMoldId, MoldId>({
    setInMutableCollection: createSetInMutableCollection({
      getCollection: (collectionId: CollectionId) =>
        workspace.data.entities.molds.collections.get(collectionId),
      isMutable: (entry: MoldCollectionEntry): entry is MoldCollectionEntry => entry.isMutable,
      setEntity: (entry: MoldCollectionEntry, baseId: BaseMoldId, entity: Entities.Molds.IMoldEntity) =>
        'set' in entry.items ? entry.items.set(baseId, entity) : fail('Collection items are read-only'),
      entityLabel: 'mold'
    }),
    entityLabel: 'mold',
    getPersistedCollection: (collectionId: CollectionId) =>
      workspace.data.entities.getPersistedMoldsCollection(collectionId)
  });

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
  const subIngredientRef = useRef<{ id: IngredientId; wrapper: LibraryRuntime.EditedIngredient } | undefined>(
    undefined
  );
  const subFillingRef = useRef<{ id: FillingId; wrapper: LibraryRuntime.EditedFillingRecipe } | undefined>(
    undefined
  );
  const subProcedureRef = useRef<{ id: ProcedureId; wrapper: LibraryRuntime.EditedProcedure } | undefined>(
    undefined
  );
  const subMoldRef = useRef<{ id: MoldId; wrapper: LibraryRuntime.EditedMold } | undefined>(undefined);
  const subDecorationRef = useRef<{ id: DecorationId; wrapper: LibraryRuntime.EditedDecoration } | undefined>(
    undefined
  );
  const [subEntitySeed, setSubEntitySeed] = useState('');
  const [confectionToDelete, setConfectionToDelete] = useState<{
    id: ConfectionId;
    name: string;
    references: IReferenceScanResult;
  } | null>(null);
  const entityActions = useEntityActions();
  const updateCascadeEntryChanges = useNavigationStore((s) => s.updateCascadeEntryChanges);

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

  const ingredientMutableCollectionId = useMutableCollection(
    workspace.data.entities.ingredients.collections,
    [workspace, reactiveWorkspace.version],
    workspace.settings?.getResolvedSettings().defaultTargets.ingredients
  );

  const writableIngredientCollections = useMemo(
    (): ReadonlyArray<{ id: string; label?: string }> =>
      getWritableCollectionOptions(
        workspace.data.entities.ingredients.collections.entries(),
        workspace.settings?.getResolvedSettings().defaultTargets.ingredients
      ),
    [workspace, reactiveWorkspace.version]
  );

  const fillingMutableCollectionId = useMutableCollection(
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

  const procedureMutableCollectionId = useMutableCollection(
    workspace.data.entities.procedures.collections,
    [workspace, reactiveWorkspace.version],
    workspace.settings?.getResolvedSettings().defaultTargets.procedures
  );

  const writableProcedureCollections = useMemo(
    (): ReadonlyArray<{ id: string; label?: string }> =>
      getWritableCollectionOptions(
        workspace.data.entities.procedures.collections.entries(),
        workspace.settings?.getResolvedSettings().defaultTargets.procedures
      ),
    [workspace, reactiveWorkspace.version]
  );

  const moldMutableCollectionId = useMutableCollection(
    workspace.data.entities.molds.collections,
    [workspace, reactiveWorkspace.version],
    workspace.settings?.getResolvedSettings().defaultTargets.molds
  );

  const writableMoldCollections = useMemo(
    (): ReadonlyArray<{ id: string; label?: string }> =>
      getWritableCollectionOptions(
        workspace.data.entities.molds.collections.entries(),
        workspace.settings?.getResolvedSettings().defaultTargets.molds
      ),
    [workspace, reactiveWorkspace.version]
  );

  const decorationMutableCollectionId = useMutableCollection(
    workspace.data.entities.decorations.collections,
    [workspace, reactiveWorkspace.version],
    workspace.settings?.getResolvedSettings().defaultTargets.decorations
  );

  const writableDecorationCollections = useMemo(
    (): ReadonlyArray<{ id: string; label?: string }> =>
      getWritableCollectionOptions(
        workspace.data.entities.decorations.collections.entries(),
        workspace.settings?.getResolvedSettings().defaultTargets.decorations
      ),
    [workspace, reactiveWorkspace.version]
  );

  const { entities: confections, selectedId } = useEntityList<LibraryRuntime.AnyConfection, ConfectionId>({
    getAll: () => workspace.data.confections.values(),
    compare: (a, b) => a.name.localeCompare(b.name),
    entityType: 'confection',
    cascadeStack: cascade.stack,
    deps: [workspace, reactiveWorkspace.version]
  });

  const confectionCreateSourceOptions = useMemo(
    (): ReadonlyArray<{ id: string; name: string }> =>
      confections.map((confection) => ({
        id: confection.id,
        name: confection.name
      })),
    [confections]
  );

  const handleSelect = useCallback(
    (id: ConfectionId): void => {
      cascade.select({
        entityType: 'confection',
        entityId: id,
        entity: workspace.data.confections.get(id).report(workspace.data.logger).orDefault()
      });
    },
    [cascade, workspace]
  );

  const handleRequestDelete = useCallback(
    (id: ConfectionId): void => {
      const result = workspace.data.confections.get(id);
      const name = result.isSuccess() ? result.value.name : id;
      const references = entityActions.scanReferences(id);
      setConfectionToDelete({ id, name, references });
    },
    [workspace, entityActions]
  );

  const handleConfirmDelete = useCallback((): void => {
    if (confectionToDelete) {
      entityActions.deleteEntity(confectionToDelete.id).catch((err) => {
        workspace.data.logger.error(`Failed to delete confection '${confectionToDelete.name}': ${err}`);
      });
      cascade.clearById(confectionToDelete.id);
    }
    setConfectionToDelete(null);
  }, [confectionToDelete, entityActions, cascade]);

  const handleCancelDelete = useCallback((): void => {
    setConfectionToDelete(null);
  }, []);

  // --------------------------------------------------------------------------
  // Start Session Dialog
  // --------------------------------------------------------------------------

  const handleRequestStartSession = useCallback(
    (confectionId: ConfectionId): void => {
      const result = workspace.data.confections.get(confectionId);
      const entityName = result.isSuccess() ? result.value.name : confectionId;
      const settings = viewSettingsMap.get(confectionId);
      // Navigate to sessions tab and open create panel pre-filled with this confection
      const store = useNavigationStore.getState();
      store.setMode('production');
      store.setTab('sessions');
      store.squashCascade([
        {
          entityType: 'session',
          entityId: CASCADE_NEW_ENTITY_ID,
          mode: 'create',
          createSessionInfo: {
            confectionId,
            entityName,
            targetFrames: settings?.targetFrames,
            targetCount: settings?.targetCount,
            bufferPercentage: settings?.bufferPercentage
          }
        }
      ]);
    },
    [workspace, viewSettingsMap]
  );

  const handleShowCreateConfection = useCallback((): void => {
    cascade.select({ entityType: 'confection', entityId: CASCADE_NEW_ENTITY_ID, mode: 'create' });
  }, [cascade]);

  const handleCreateConfectionCancel = useCallback((): void => {
    cascade.clear();
  }, [cascade]);

  // Handle creating a confection from a pasted entity (add to mutable collection, open in edit mode)
  const handleCreateConfection = useCallback(
    async (
      entity: Entities.Confections.AnyConfectionRecipeEntity,
      __source: 'manual' | 'ai',
      targetCollectionId?: string
    ): Promise<void> => {
      const baseId = entity.baseId as BaseConfectionId;
      const createResult = await confectionMutation.createEntity({
        targetCollectionId: targetCollectionId as CollectionId | undefined,
        defaultCollectionId: mutableCollectionId,
        getCompositeId: (collectionId: CollectionId, nextBaseId: BaseConfectionId) =>
          `${collectionId}.${nextBaseId}` as ConfectionId,
        baseId,
        entity,
        exists: (id: ConfectionId) => workspace.data.confections.get(id).isSuccess(),
        persistToDisk: false
      });
      if (createResult.isFailure()) {
        workspace.data.logger.error(`Failed to create confection: ${createResult.message}`);
        return;
      }

      const compositeId = createResult.value;

      // Open in edit mode
      editVariationSpecRef.current = entity.goldenVariationSpec;
      cascade.select({
        entityType: 'confection',
        entityId: compositeId,
        mode: 'edit' as const,
        entity: workspace.data.confections.get(compositeId).report(workspace.data.logger).orDefault()
      });
    },
    [workspace, mutableCollectionId, confectionMutation, cascade]
  );

  const handleCreateConfectionFromSource = useCallback(
    (params: {
      mode: 'copy' | 'derive';
      sourceId: string;
      name: string;
      id: string;
      targetCollectionId?: string;
    }): void => {
      const sourceResult = workspace.data.confections.get(params.sourceId as ConfectionId);
      if (sourceResult.isFailure()) {
        workspace.data.logger.error(`Cannot ${params.mode} confection '${params.sourceId}': not found`);
        return;
      }

      const source = sourceResult.value;
      const today = new Date().toISOString().split('T')[0] ?? '';
      const sourceVariationIdResult = Helpers.createConfectionRecipeVariationId({
        collectionId: source.id,
        itemId: source.goldenVariationSpec
      });

      const nextEntity: Entities.Confections.AnyConfectionRecipeEntity = {
        ...source.entity,
        baseId: params.id as BaseConfectionId,
        name: params.name as typeof source.entity.name,
        derivedFrom:
          params.mode === 'derive' && sourceVariationIdResult.isSuccess()
            ? {
                sourceVariationId: sourceVariationIdResult.value,
                derivedDate: today
              }
            : source.entity.derivedFrom
      };

      void handleCreateConfection(nextEntity, 'manual', params.targetCollectionId);
    },
    [workspace, handleCreateConfection]
  );

  const handleListHeaderPaste = useClipboardJsonImport<Entities.Confections.AnyConfectionRecipeEntity>({
    entityLabel: 'confection',
    convert: (from: unknown) => Entities.Confections.Converters.anyConfectionEntity.convert(from),
    onValid: (entity: Entities.Confections.AnyConfectionRecipeEntity) => handleCreateConfection(entity, 'ai'),
    onValidSuccessMessage: (entity: Entities.Confections.AnyConfectionRecipeEntity) =>
      `Opened '${entity.name}' for review — save when ready`
  });

  // ============================================================================
  // Editing State Management
  // ============================================================================

  const getOrCreateEditingState = useCallback(
    (
      confection: LibraryRuntime.IConfectionBase,
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
      editVariationSpecRef.current = variationSpec;
      cascade
        .find((e) => e.entityId === entityId && e.entityType === 'confection')
        .onSuccess(({ depth }) => cascade.openEditor(depth));
    },
    [cascade]
  );

  const handlePreviewConfection = useCallback(
    (entityId: string): void => {
      cascade
        .find((e) => e.entityId === entityId && e.entityType === 'confection')
        .onSuccess(({ depth }) =>
          cascade.openNested(depth, { entityType: 'confection', entityId, mode: 'preview' })
        );
    },
    [cascade]
  );

  const handleCloseConfectionPreview = useCallback(
    (_entityId: string): void => {
      cascade.pop();
    },
    [cascade]
  );

  const handleCancelConfectionEdit = useCallback(
    (entityId: string): void => {
      if (editingRef.current?.id === entityId) {
        editingRef.current = undefined;
      }
      subIngredientRef.current = undefined;
      subFillingRef.current = undefined;
      subProcedureRef.current = undefined;
      subMoldRef.current = undefined;
      subDecorationRef.current = undefined;
      cascade
        .find((e) => e.entityId === entityId && e.entityType === 'confection')
        .onSuccess(({ depth }) => cascade.popToView(depth));
    },
    [cascade]
  );

  // ============================================================================
  // Sub-Entity Creation (Ingredients / Fillings / Procedures from Confection Editor)
  // ============================================================================

  const makeSubEntityCascadeHandler = useCallback(
    (entityType: CascadeEntityType) =>
      (seed: string): void => {
        cascade
          .find((e) => e.entityType === 'confection' && e.mode === 'edit')
          .onSuccess(({ depth }) => {
            setSubEntitySeed(seed);
            return cascade.openNested(depth, { entityType, entityId: CASCADE_NEW_ENTITY_ID, mode: 'create' });
          });
      },
    [cascade]
  );

  const handleCreateIngredientFromConfection = useMemo(
    () => makeSubEntityCascadeHandler('ingredient'),
    [makeSubEntityCascadeHandler]
  );
  const handleCreateFillingFromConfection = useMemo(
    () => makeSubEntityCascadeHandler('filling'),
    [makeSubEntityCascadeHandler]
  );
  const handleCreateProcedureFromConfection = useMemo(
    () => makeSubEntityCascadeHandler('procedure'),
    [makeSubEntityCascadeHandler]
  );
  const handleCreateMoldFromConfection = useMemo(
    () => makeSubEntityCascadeHandler('mold'),
    [makeSubEntityCascadeHandler]
  );
  const handleCreateDecorationFromConfection = useMemo(
    () => makeSubEntityCascadeHandler('decoration'),
    [makeSubEntityCascadeHandler]
  );

  const handleSubEntityCancel = useCallback((): void => {
    setSubEntitySeed('');
    cascade.pop();
  }, [cascade]);

  const handleSubIngredientCreate = useCallback(
    async (
      entity: Entities.Ingredients.IngredientEntity,
      _source: 'manual' | 'ai',
      selectedCollectionId?: string
    ): Promise<void> => {
      const ingredientCollectionId =
        (selectedCollectionId as CollectionId | undefined) ?? ingredientMutableCollectionId;
      if (!ingredientCollectionId) {
        workspace.data.logger.error('Cannot add ingredient: no mutable ingredient collection available');
        return;
      }
      const baseId = entity.baseId as BaseIngredientId;

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

      const compositeId = createResult.value;

      setSubEntitySeed('');
      LibraryRuntime.EditedIngredient.create(entity)
        .report(workspace.data.logger)
        .onSuccess((wrapper) => {
          subIngredientRef.current = { id: compositeId, wrapper };
          return cascade
            .find((e) => e.entityType === 'confection' && e.mode === 'edit')
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
      cascade.pop();
    },
    [cascade, ingredientMutation]
  );

  const handleSubIngredientCancel = useCallback((): void => {
    subIngredientRef.current = undefined;
    cascade.pop();
  }, [cascade]);

  const handleSubFillingCreate = useCallback(
    async (
      entity: Entities.Fillings.IFillingRecipeEntity,
      _source: 'manual' | 'ai',
      selectedCollectionId?: string
    ): Promise<void> => {
      const fillingCollectionId =
        (selectedCollectionId as CollectionId | undefined) ?? fillingMutableCollectionId;
      if (!fillingCollectionId) {
        workspace.data.logger.error('Cannot add filling: no mutable filling collection available');
        return;
      }
      const baseId = entity.baseId as BaseFillingId;

      const createResult = await fillingMutation.createEntity({
        targetCollectionId: fillingCollectionId,
        getCompositeId: (collectionId: CollectionId, nextBaseId: BaseFillingId) =>
          `${collectionId}.${nextBaseId}` as FillingId,
        baseId,
        entity,
        exists: (id: FillingId) => workspace.data.fillings.get(id).isSuccess(),
        persistToDisk: true
      });
      if (createResult.isFailure()) {
        return;
      }

      const compositeId = createResult.value;

      setSubEntitySeed('');
      LibraryRuntime.EditedFillingRecipe.create(entity)
        .report(workspace.data.logger)
        .onSuccess((wrapper) => {
          subFillingRef.current = { id: compositeId, wrapper };
          return cascade
            .find((e) => e.entityType === 'confection' && e.mode === 'edit')
            .onSuccess(({ depth }) =>
              cascade.openNested(depth, {
                entityType: 'filling',
                entityId: compositeId,
                mode: 'edit',
                entity: workspace.data.fillings.get(compositeId).report(workspace.data.logger).orDefault()
              })
            );
        });
    },
    [workspace, cascade, fillingMutation, fillingMutableCollectionId]
  );

  const handleSubFillingSave = useCallback(
    async (__mode: FillingSaveMode): Promise<void> => {
      const subState = subFillingRef.current;
      if (!subState) return;
      const entity = subState.wrapper.current;
      const compositeId = subState.id;
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

      subFillingRef.current = undefined;
      cascade.pop();
    },
    [cascade, fillingMutation]
  );

  const handleSubFillingCancel = useCallback((): void => {
    subFillingRef.current = undefined;
    cascade.pop();
  }, [cascade]);

  const handleSubProcedureCreate = useCallback(
    async (
      entity: Entities.Procedures.IProcedureEntity,
      _source: 'manual' | 'ai',
      selectedCollectionId?: string
    ): Promise<void> => {
      const procedureCollectionId =
        (selectedCollectionId as CollectionId | undefined) ?? procedureMutableCollectionId;
      if (!procedureCollectionId) {
        workspace.data.logger.error('Cannot add procedure: no mutable procedure collection available');
        return;
      }
      const baseId = entity.baseId as BaseProcedureId;

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

      const compositeId = createResult.value;

      setSubEntitySeed('');
      LibraryRuntime.EditedProcedure.create(entity)
        .report(workspace.data.logger)
        .onSuccess((wrapper) => {
          subProcedureRef.current = { id: compositeId, wrapper };
          return cascade
            .find((e) => e.entityType === 'confection' && e.mode === 'edit')
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
      cascade.pop();
    },
    [cascade, procedureMutation]
  );

  const handleSubProcedureCancel = useCallback((): void => {
    subProcedureRef.current = undefined;
    cascade.pop();
  }, [cascade]);

  const handleSubMoldCreate = useCallback(
    async (
      entity: Entities.Molds.IMoldEntity,
      _source: 'manual' | 'ai',
      selectedCollectionId?: string
    ): Promise<void> => {
      const moldCollectionId = (selectedCollectionId as CollectionId | undefined) ?? moldMutableCollectionId;
      if (!moldCollectionId) {
        workspace.data.logger.error('Cannot add mold: no mutable mold collection available');
        return;
      }
      const baseId = entity.baseId as BaseMoldId;

      const createResult = await moldMutation.createEntity({
        targetCollectionId: moldCollectionId,
        getCompositeId: (collectionId: CollectionId, nextBaseId: BaseMoldId) =>
          `${collectionId}.${nextBaseId}` as MoldId,
        baseId,
        entity,
        exists: (id: MoldId) => workspace.data.molds.get(id).isSuccess(),
        persistToDisk: true
      });
      if (createResult.isFailure()) {
        return;
      }

      const compositeId = createResult.value;

      setSubEntitySeed('');
      LibraryRuntime.EditedMold.create(entity)
        .report(workspace.data.logger)
        .onSuccess((wrapper) => {
          subMoldRef.current = { id: compositeId, wrapper };
          return cascade
            .find((e) => e.entityType === 'confection' && e.mode === 'edit')
            .onSuccess(({ depth }) =>
              cascade.openNested(depth, {
                entityType: 'mold',
                entityId: compositeId,
                mode: 'edit',
                entity: workspace.data.molds.get(compositeId).report(workspace.data.logger).orDefault()
              })
            );
        });
    },
    [workspace, cascade, moldMutation, moldMutableCollectionId]
  );

  const handleSubMoldSave = useCallback(
    async (wrapper: LibraryRuntime.EditedMold): Promise<void> => {
      const entity = wrapper.current;
      const compositeId = subMoldRef.current?.id;
      if (!compositeId) return;
      const baseId = entity.baseId as BaseMoldId;

      const saveResult = await moldMutation.saveEntity({
        compositeId,
        baseId,
        entity,
        persistToDisk: true
      });
      if (saveResult.isFailure()) {
        return;
      }

      // Back-populate the mold onto the confection variation being edited
      const editing = editingRef.current;
      if (editing) {
        const moldId = compositeId as MoldId;
        const spec = editing.selectedVariationSpec;
        const variation = editing.wrapper.current.variations.find((v) => v.variationSpec === spec);
        if (variation && Entities.Confections.isMoldedBonBonRecipeVariationEntity(variation)) {
          const existing = variation.molds;
          const options = existing.options.some((o) => o.id === moldId)
            ? existing.options
            : [...existing.options, { id: moldId }];
          editing.wrapper.setVariationMolds(spec, { options, preferredId: moldId });
        }
      }

      subMoldRef.current = undefined;
      cascade.pop();
    },
    [cascade, moldMutation]
  );

  const handleSubMoldCancel = useCallback((): void => {
    subMoldRef.current = undefined;
    cascade.pop();
  }, [cascade]);

  const handleSubDecorationCreate = useCallback(
    async (
      entity: Entities.Decorations.IDecorationEntity,
      _source: 'manual' | 'ai',
      selectedCollectionId?: string
    ): Promise<void> => {
      const decorationCollectionId =
        (selectedCollectionId as CollectionId | undefined) ?? decorationMutableCollectionId;
      if (!decorationCollectionId) {
        workspace.data.logger.error('Cannot add decoration: no mutable decoration collection available');
        return;
      }
      const baseId = entity.baseId as BaseDecorationId;

      const createResult = await decorationMutation.createEntity({
        targetCollectionId: decorationCollectionId,
        getCompositeId: (collectionId: CollectionId, nextBaseId: BaseDecorationId) =>
          `${collectionId}.${nextBaseId}` as DecorationId,
        baseId,
        entity,
        exists: (id: DecorationId) => workspace.data.decorations.get(id).isSuccess(),
        persistToDisk: true
      });
      if (createResult.isFailure()) {
        return;
      }

      const compositeId = createResult.value;

      setSubEntitySeed('');
      LibraryRuntime.EditedDecoration.create(entity)
        .report(workspace.data.logger)
        .onSuccess((wrapper) => {
          subDecorationRef.current = { id: compositeId, wrapper };
          return cascade
            .find((e) => e.entityType === 'confection' && e.mode === 'edit')
            .onSuccess(({ depth }) =>
              cascade.openNested(depth, {
                entityType: 'decoration',
                entityId: compositeId,
                mode: 'edit',
                entity: workspace.data.decorations.get(compositeId).report(workspace.data.logger).orDefault()
              })
            );
        });
    },
    [workspace, cascade, decorationMutation, decorationMutableCollectionId]
  );

  const handleSubDecorationSave = useCallback(
    async (wrapper: LibraryRuntime.EditedDecoration): Promise<void> => {
      const entity = wrapper.current;
      const compositeId = subDecorationRef.current?.id;
      if (!compositeId) return;
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

      // Back-populate the decoration onto the confection variation being edited
      const editing = editingRef.current;
      if (editing) {
        const decorationId = compositeId as DecorationId;
        const spec = editing.selectedVariationSpec;
        const variation = editing.wrapper.current.variations.find((v) => v.variationSpec === spec);
        if (variation) {
          const current = variation.decorations;
          const currentOptions = current?.options ?? [];
          if (!currentOptions.some((o) => o.id === decorationId)) {
            const newOptions = [...currentOptions, { id: decorationId }];
            const preferredId = current?.preferredId ?? decorationId;
            editing.wrapper.setVariationDecorations(spec, { options: newOptions, preferredId });
          }
        }
      }

      subDecorationRef.current = undefined;
      cascade.pop();
    },
    [cascade, decorationMutation]
  );

  const handleSubDecorationCancel = useCallback((): void => {
    subDecorationRef.current = undefined;
    cascade.pop();
  }, [cascade]);

  const handleSaveConfection = useCallback(
    async (entityId: string, mode: ConfectionSaveMode): Promise<void> => {
      const state = editingRef.current;
      if (!state) {
        workspace.data.logger.error('Save failed: no editing state');
        return;
      }

      // ---- new-recipe: create a derived recipe in the mutable collection ----
      if (mode === 'new-recipe') {
        if (!mutableCollectionId) {
          workspace.data.logger.error('Save failed: no mutable collection available');
          return;
        }

        const originalEntity = state.wrapper.current;
        const today = new Date().toISOString().split('T')[0]!;
        const safeName = saveAsName.trim() || originalEntity.name;
        const newBaseId = `${slugify(safeName)}-${today}` as BaseConfectionId;

        const sourceConfectionId = state.id as ConfectionId;
        const sourceVariationIdResult = Helpers.createConfectionRecipeVariationId({
          collectionId: sourceConfectionId,
          itemId: state.selectedVariationSpec
        });

        const newEntity: Entities.Confections.AnyConfectionRecipeEntity = {
          ...originalEntity,
          baseId: newBaseId,
          name: safeName as typeof originalEntity.name,
          derivedFrom: sourceVariationIdResult.isSuccess()
            ? { sourceVariationId: sourceVariationIdResult.value, derivedDate: today }
            : undefined
        };

        const createResult = await confectionMutation.createEntity({
          targetCollectionId: mutableCollectionId,
          getCompositeId: (collectionId: CollectionId, nextBaseId: BaseConfectionId) =>
            `${collectionId}.${nextBaseId}` as ConfectionId,
          baseId: newBaseId,
          entity: newEntity,
          exists: (id: ConfectionId) => workspace.data.confections.get(id).isSuccess(),
          persistToDisk: true
        });
        if (createResult.isFailure()) {
          return;
        }
        const newCompositeId = createResult.value;
        workspace.data.logger.info(`Saved copy '${safeName}' to collection '${mutableCollectionId}'`);
        editingRef.current = undefined;
        setShowSaveAsForm(false);
        setSaveAsName('');
        cascade.select({
          entityType: 'confection',
          entityId: newCompositeId,
          entity: workspace.data.confections.get(newCompositeId).report(workspace.data.logger).orDefault()
        });
        return;
      }

      // ---- new-variation: save edits as a new variation, revert the original ----
      if (mode === 'new-variation') {
        const spec = state.selectedVariationSpec;
        const editedVariation = state.wrapper.current.variations.find((v) => v.variationSpec === spec);
        const originalVariation = state.wrapper.initial.variations.find((v) => v.variationSpec === spec);
        if (!editedVariation) {
          workspace.data.logger.error('Save failed: edited variation not found');
          return;
        }

        // Generate a new variation spec
        const today = new Date().toISOString().split('T')[0]!;
        const newSpec = `${today}-${String(state.wrapper.variations.length + 1).padStart(
          2,
          '0'
        )}` as ConfectionRecipeVariationSpec;

        // Revert the original variation if it existed before editing
        if (originalVariation) {
          state.wrapper.replaceVariation(spec, originalVariation);
        }

        // Add the edited content as a new variation with the new spec
        const newVariation = { ...editedVariation, variationSpec: newSpec };
        const addResult = state.wrapper.addVariation(newVariation);
        if (addResult.isFailure()) {
          workspace.data.logger.error(`Save failed (add variation): ${addResult.message}`);
          return;
        }
      }

      // ---- update (default) and new-variation: persist wrapper.current ----
      const entity = state.wrapper.current;
      const compositeId = state.id;
      const baseId = entity.baseId as BaseConfectionId;

      const saveResult = await confectionMutation.saveEntity({
        compositeId,
        baseId,
        entity,
        persistToDisk: true
      });
      if (saveResult.isFailure()) {
        return;
      }

      viewVariationSpecRef.current = editingRef.current?.selectedVariationSpec;

      if (editingRef.current?.id === entityId) {
        editingRef.current = undefined;
      }
      const refreshedEntity = workspace.data.confections
        .get(entityId as ConfectionId)
        .report(workspace.data.logger)
        .orDefault();
      cascade
        .find((e) => e.entityId === entityId && e.entityType === 'confection')
        .onSuccess(({ depth }) => cascade.popToView(depth, refreshedEntity));
    },
    [workspace, cascade, mutableCollectionId, saveAsName, confectionMutation]
  );

  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascade.stack.map((entry, index) => {
      const onIngredientClick = (id: IngredientId): void => {
        cascade.drillDown(index, {
          entityType: 'ingredient',
          entityId: id,
          entity: workspace.data.ingredients.get(id).report(workspace.data.logger).orDefault()
        });
      };
      const onFillingClick = (
        id: FillingId,
        targetWeight?: number,
        sourceConfectionId?: string,
        sourceSlotId?: string
      ): void => {
        cascade.drillDown(index, {
          entityType: 'filling',
          entityId: id,
          targetWeight,
          sourceConfectionId,
          sourceSlotId,
          entity: workspace.data.fillings.get(id).report(workspace.data.logger).orDefault()
        });
      };
      const onMoldClick = (id: MoldId): void => {
        cascade.drillDown(index, {
          entityType: 'mold',
          entityId: id,
          entity: workspace.data.molds.get(id).report(workspace.data.logger).orDefault()
        });
      };
      const onProcedureClick = (id: ProcedureId): void => {
        cascade.drillDown(index, {
          entityType: 'procedure',
          entityId: id,
          entity: workspace.data.procedures.get(id).report(workspace.data.logger).orDefault()
        });
      };
      const onDecorationClick = (id: DecorationId): void => {
        cascade.drillDown(index, {
          entityType: 'decoration',
          entityId: id,
          entity: workspace.data.decorations.get(id).report(workspace.data.logger).orDefault()
        });
      };
      const onTaskClick = (id: TaskId): void => {
        cascade.drillDown(index, {
          entityType: 'task',
          entityId: id,
          entity: workspace.data.tasks.get(id).report(workspace.data.logger).orDefault()
        });
      };

      if (isConfectionCascadeEntry(entry)) {
        if (entry.mode === 'create') {
          return {
            key: CASCADE_NEW_ENTITY_ID,
            label: 'New Confection',
            content: (
              <ConfectionCreatePanel
                onCreateConfection={handleCreateConfection}
                onCancel={handleCreateConfectionCancel}
                sourceOptions={confectionCreateSourceOptions}
                onCreateFromSource={handleCreateConfectionFromSource}
                writableCollections={writableConfectionCollections}
                defaultTargetCollectionId={mutableCollectionId}
              />
            )
          };
        }

        const confection = entry.entity;
        if (!confection) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load confection: {entry.entityId}</div>
          };
        }

        // Edit mode
        if (entry.mode === 'edit') {
          const state = getOrCreateEditingState(confection, editVariationSpecRef.current);
          editVariationSpecRef.current = undefined;
          if (!state) {
            return {
              key: entry.entityId,
              label: confection.name,
              content: <div className="p-4 text-red-500">Failed to create editing state</div>
            };
          }
          const sourceCollectionId = (state.id as string).split('.')[0] as CollectionId;
          const sourceColResult = workspace.data.entities.confections.collections.get(sourceCollectionId);
          const isSourceReadOnly = sourceColResult.isSuccess() && !sourceColResult.value.isMutable;

          // Read-only source: show gate instead of full editor
          if (isSourceReadOnly) {
            return {
              key: `${entry.entityId}:edit`,
              label: confection.name,
              content: (
                <ReadOnlyEditGate
                  entityName={confection.name}
                  onSaveCopy={
                    mutableCollectionId
                      ? (): void => void handleSaveConfection(entry.entityId, 'new-recipe')
                      : undefined
                  }
                  onCancel={(): void => handleCancelConfectionEdit(entry.entityId)}
                />
              )
            };
          }

          return {
            key: `${entry.entityId}:edit`,
            label: `Editing: ${confection.name}`,
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
                        if (e.key === 'Enter') void handleSaveConfection(entry.entityId, 'new-recipe');
                        if (e.key === 'Escape') {
                          setShowSaveAsForm(false);
                          setSaveAsName('');
                        }
                      }}
                      placeholder={confection.name}
                      className="flex-1 text-xs border border-amber-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-choco-primary"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={(): void => void handleSaveConfection(entry.entityId, 'new-recipe')}
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
                  confection={confection}
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
                  onAddMold={handleCreateMoldFromConfection}
                  onAddDecoration={handleCreateDecorationFromConfection}
                  onSave={(mode: ConfectionSaveMode): void => {
                    if (mode === 'new-recipe') {
                      setSaveAsName(confection.name);
                      setShowSaveAsForm(true);
                    } else {
                      void handleSaveConfection(entry.entityId, mode);
                    }
                  }}
                  onCancel={(): void => handleCancelConfectionEdit(entry.entityId)}
                  onFillingClick={onFillingClick}
                  onIngredientClick={onIngredientClick}
                  onMoldClick={onMoldClick}
                  onProcedureClick={onProcedureClick}
                  onDecorationClick={onDecorationClick}
                  onMutation={(): void => {
                    updateCascadeEntryChanges(
                      entry.entityId,
                      state.wrapper.hasChanges(state.wrapper.initial)
                    );
                  }}
                />
              </div>
            )
          };
        }

        // View mode (default)
        const defaultSpec =
          viewVariationSpecRef.current !== undefined &&
          confection.entity.variations.some((v) => v.variationSpec === viewVariationSpecRef.current)
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
            label: `Preview: ${confection.name}`,
            content: (
              <ConfectionPreviewPanel
                confection={confection}
                viewSettings={viewSettingsMap.get(entityId)}
                onClose={(): void => handleCloseConfectionPreview(entityId)}
              />
            )
          };
        }

        return {
          key: entityId,
          label: confection.name,
          content: (
            <ConfectionDetail
              confection={confection}
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
              onStartSession={(): void => handleRequestStartSession(entityId as ConfectionId)}
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
                writableCollections={writableFillingCollections}
                defaultTargetCollectionId={fillingMutableCollectionId}
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
            return {
              key: `${entry.entityId}:sub-edit`,
              label: `Editing: ${fillingResult.value.name}`,
              content: (
                <FillingEditView
                  wrapper={subState.wrapper}
                  selectedVariationSpec={goldenSpec}
                  onVariationChange={(): void => undefined}
                  availableIngredients={availableIngredients}
                  availableProcedures={availableProcedures}
                  onCreateIngredient={handleCreateIngredientFromConfection}
                  onCreateProcedure={handleCreateProcedureFromConfection}
                  onSave={handleSubFillingSave}
                  onCancel={handleSubFillingCancel}
                />
              )
            };
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
        const liveTargetWeight = (() => {
          if (!entry.sourceConfectionId || !entry.sourceSlotId) return entry.targetWeight;
          const confResult = workspace.data.confections.get(entry.sourceConfectionId as ConfectionId);
          if (confResult.isFailure()) return entry.targetWeight;
          const variation = confResult.value.goldenVariation;
          const settings = viewSettingsMap.get(entry.sourceConfectionId);
          // Use viewSettings if available, else default from the recipe yield
          const defaultTarget: LibraryRuntime.IConfectionScalingTarget = Entities.Confections.isYieldInFrames(
            variation.yield
          )
            ? { targetFrames: variation.yield.numFrames }
            : { targetCount: variation.yield.numPieces };
          const target: LibraryRuntime.IConfectionScalingTarget = {
            targetFrames: settings?.targetFrames ?? defaultTarget.targetFrames,
            bufferPercentage: settings?.bufferPercentage ?? defaultTarget.bufferPercentage,
            targetCount: settings?.targetCount ?? defaultTarget.targetCount,
            selectedMoldId: settings?.moldId,
            fillingSelections: settings?.fillingSelections
          };
          if (!LibraryRuntime.canScale(variation, target)) return undefined;
          const scaleResult = LibraryRuntime.computeScaledFillings(variation, target);
          if (!scaleResult.isSuccess()) return entry.targetWeight;
          const slot = scaleResult.value.slots.find((s) => s.slotId === entry.sourceSlotId);
          return slot?.targetWeight ?? entry.targetWeight;
        })();
        return {
          key: entry.entityId,
          label: result.value.name,
          content: (
            <FillingDetail
              filling={result.value}
              onIngredientClick={onIngredientClick}
              onProcedureClick={onProcedureClick}
              targetYield={liveTargetWeight}
              onClose={(): void => popCascadeTo(index)}
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
                writableCollections={writableIngredientCollections}
                defaultTargetCollectionId={ingredientMutableCollectionId}
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
          content: <IngredientDetail ingredient={result.value} onClose={(): void => popCascadeTo(index)} />
        };
      }
      if (entry.entityType === 'mold') {
        if (entry.mode === 'create') {
          return {
            key: '__new_mold__',
            label: 'New Mold',
            content: (
              <EntityCreateForm<Entities.Molds.IMoldEntity>
                slugify={slugify}
                buildPrompt={AiAssist.buildMoldAiPrompt}
                convert={(from: unknown) => Entities.Molds.Converters.moldEntity.convert(from)}
                makeBlank={(name: string, id: string): Entities.Molds.IMoldEntity =>
                  createBlankMoldEntity(id as BaseMoldId, name, name)
                }
                initialName={subEntitySeed}
                writableCollections={writableMoldCollections}
                defaultTargetCollectionId={moldMutableCollectionId}
                onCreate={handleSubMoldCreate}
                onCancel={handleSubEntityCancel}
              />
            )
          };
        }
        if (entry.mode === 'edit') {
          const subState = subMoldRef.current;
          if (subState) {
            return {
              key: `${entry.entityId}:sub-edit`,
              label: `Editing: ${subState.wrapper.current.manufacturer} ${subState.wrapper.current.productNumber}`,
              content: (
                <MoldEditView
                  wrapper={subState.wrapper}
                  onSave={handleSubMoldSave}
                  onCancel={handleSubMoldCancel}
                />
              )
            };
          }
        }
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
          content: <MoldDetail mold={result.value} onClose={(): void => popCascadeTo(index)} />
        };
      }
      if (entry.entityType === 'decoration') {
        if (entry.mode === 'create') {
          return {
            key: '__new_decoration__',
            label: 'New Decoration',
            content: (
              <EntityCreateForm<Entities.Decorations.IDecorationEntity>
                slugify={slugify}
                buildPrompt={AiAssist.buildDecorationAiPrompt}
                convert={(from: unknown) => Entities.Decorations.Converters.decorationEntity.convert(from)}
                makeBlank={(name: string, id: string): Entities.Decorations.IDecorationEntity =>
                  createBlankDecorationEntity(id as BaseDecorationId, name)
                }
                initialName={subEntitySeed}
                writableCollections={writableDecorationCollections}
                defaultTargetCollectionId={decorationMutableCollectionId}
                onCreate={handleSubDecorationCreate}
                onCancel={handleSubEntityCancel}
              />
            )
          };
        }
        if (entry.mode === 'edit') {
          const subState = subDecorationRef.current;
          if (subState) {
            return {
              key: `${entry.entityId}:sub-edit`,
              label: `Editing: ${subState.wrapper.current.name}`,
              content: (
                <DecorationEditView
                  wrapper={subState.wrapper}
                  availableIngredients={availableIngredients}
                  availableProcedures={availableProcedures}
                  onCreateIngredient={handleCreateIngredientFromConfection}
                  onCreateProcedure={handleCreateProcedureFromConfection}
                  onSave={handleSubDecorationSave}
                  onCancel={handleSubDecorationCancel}
                />
              )
            };
          }
        }
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
                writableCollections={writableProcedureCollections}
                defaultTargetCollectionId={procedureMutableCollectionId}
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
          content: (
            <ProcedureDetail
              procedure={result.value}
              onTaskClick={onTaskClick}
              onClose={(): void => popCascadeTo(index)}
            />
          )
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
    handleSelect,
    handleRequestDelete,
    handleShowCreateConfection,
    handleCreateConfectionFromSource,
    handleListHeaderPaste,
    variationCompare,
    getOrCreateEditingState,
    handleViewSettingsChange,
    handleRequestStartSession,
    confectionCreateSourceOptions,
    writableConfectionCollections,
    mutableCollectionId,
    handleCreateConfection,
    cascade,
    availableIngredients,
    availableFillings,
    availableProcedures,
    availableMolds,
    availableDecorations,
    availableTasks
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
    <>
      <ConfirmDialog
        isOpen={confectionToDelete !== null}
        title="Delete Confection"
        message={
          <>
            Delete <strong>{confectionToDelete?.name}</strong>? This cannot be undone.
            {confectionToDelete?.references.hasReferences && (
              <>
                <br />
                <br />
                <span className="text-red-600 font-medium">Referenced by:</span>
                <ul className="mt-1 ml-4 list-disc text-sm">
                  {confectionToDelete.references.hits.map((hit) => (
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
              <div className="flex-1" />
              <button
                onClick={handleShowCreateConfection}
                disabled={mutableCollectionId === undefined}
                title={mutableCollectionId === undefined ? 'No mutable collection available' : undefined}
                className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                + New Confection
              </button>
              <button
                onClick={handleListHeaderPaste}
                disabled={mutableCollectionId === undefined}
                title="Paste confection from clipboard (JSON)"
                className="p-1.5 text-gray-500 hover:text-choco-primary hover:bg-gray-100 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CursorArrowRaysIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
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
                onDelete={handleRequestDelete}
                canDelete={canDeleteConfection}
                emptyState={{
                  title: 'No Confections',
                  description: 'No confections found in the library.'
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
