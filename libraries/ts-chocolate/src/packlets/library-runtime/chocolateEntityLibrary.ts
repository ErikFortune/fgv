// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * Main ChocolateEntityLibrary class - unified access to ingredients and recipe
 * data-layer entities.
 * @packageDocumentation
 */

import { Converter, Logging, Result, Success, fail, succeed } from '@fgv/ts-utils';

import {
  Converters as CommonConverters,
  CollectionId,
  BaseIngredientId,
  BaseFillingId,
  BaseMoldId,
  BaseProcedureId,
  BaseTaskId,
  BaseConfectionId,
  BaseDecorationId
} from '../common';
import * as Entities from '../entities';
import { IngredientEntity, IngredientsLibrary } from '../entities';
import { IFillingRecipeEntity, FillingsLibrary } from '../entities';
import { Converters as EntityConverters } from '../entities';
import { IMoldEntity, MoldsLibrary } from '../entities';
import { IProcedureEntity, ProceduresLibrary } from '../entities';
import { IRawTaskEntity, TasksLibrary } from '../entities';
import { IDecorationEntity, DecorationsLibrary } from '../entities';
import { CryptoUtils } from '@fgv/ts-extras';
import { EditableCollection, ISyncProvider, PersistedEditableCollection } from '../editing';
import {
  FullLibraryLoadSpec,
  IFileTreeSource,
  ILibraryFileTreeSource,
  SubLibraryBase,
  normalizeFileSources,
  resolveBuiltInSpec,
  SubLibraryId
} from '../library-data';

// ============================================================================
// Persistence Configuration
// ============================================================================

/**
 * Configuration for the persistence pipeline, supplied after library creation
 * via {@link ChocolateEntityLibrary.configurePersistence | configurePersistence()}.
 *
 * @public
 */
export interface IPersistenceConfig {
  /**
   * Provider for flushing FileTree changes to the filesystem.
   * In the web app, wraps `reactiveWorkspace.syncAllToDisk()`.
   */
  readonly syncProvider?: ISyncProvider;

  /**
   * Encryption provider (or lazy getter) for encrypted collections.
   * Use a getter function when the provider is not yet available at
   * configuration time (e.g. a KeyStore that is unlocked after startup).
   */
  readonly encryptionProvider?:
    | CryptoUtils.IEncryptionProvider
    | (() => CryptoUtils.IEncryptionProvider | undefined);
}

// ============================================================================
// Parameters Interface
// ============================================================================

/**
 * Pre-built library instances to include in a {@link LibraryRuntime.ChocolateEntityLibrary | ChocolateEntityLibrary}.
 * Useful for testing or when libraries are constructed through other means.
 * @public
 */
export interface IInstantiatedEntityLibrarySources {
  /**
   * Pre-built ingredients library
   */
  readonly ingredients?: IngredientsLibrary;

  /**
   * Pre-built fillings library
   */
  readonly fillings?: FillingsLibrary;

  /**
   * Pre-built molds library
   */
  readonly molds?: MoldsLibrary;

  /**
   * Pre-built procedures library
   */
  readonly procedures?: ProceduresLibrary;

  /**
   * Pre-built tasks library
   */
  readonly tasks?: TasksLibrary;

  /**
   * Pre-built confections library
   */
  readonly confections?: Entities.Confections.ConfectionsLibrary;

  /**
   * Pre-built decorations library
   */
  readonly decorations?: DecorationsLibrary;
}

/**
 * Parameters for creating a {@link LibraryRuntime.ChocolateEntityLibrary | ChocolateEntityLibrary}.
 *
 * Sources are processed in order:
 * 1. Built-in collections (if enabled)
 * 2. File tree sources (in array order)
 * 3. Pre-instantiated libraries (merged in)
 *
 * When multiple sources provide the same collection ID within a sub-library,
 * an error is returned (strict mode - no overwrites).
 *
 * @public
 */
export interface IChocolateEntityLibraryCreateParams {
  /**
   * {@link LibraryData.FullLibraryLoadSpec | Specifies built-in data loading} for each sub-library.
   *
   * - `true` (default): Load all built-ins for all sub-libraries
   * - `false`: Load no built-ins
   * - Per-sub-library control with `ingredients`, `recipes`, or `default` keys
   */
  readonly builtin?: FullLibraryLoadSpec;

  /**
   * {@link LibraryData.ILibraryFileTreeSource | File tree sources} to load data from.
   * Each source navigates to standard paths (data/ingredients, data/recipes)
   * and loads collections according to the source's load spec.
   */
  readonly fileSources?: ILibraryFileTreeSource | ReadonlyArray<ILibraryFileTreeSource>;

  /**
   * Pre-instantiated {@link LibraryRuntime.IInstantiatedLibrarySource | library sources}.
   * Used for advanced scenarios like testing or custom library construction.
   * If provided along with other sources, collections are combined.
   */
  readonly libraries?: IInstantiatedEntityLibrarySources;

  /**
   * Optional logger for reporting load/merge issues.
   */
  readonly logger?: Logging.LogReporter<unknown>;
}

/**
 * Main entry point for the chocolate data entity library
 *
 * Provides unified access to:
 * - Ingredient management (multi-source with built-ins)
 * - Recipe management (multi-source)
 * - Molds, procedures, tasks, and confections
 *
 * @public
 */
export class ChocolateEntityLibrary {
  private readonly _ingredients: IngredientsLibrary;
  private readonly _recipes: FillingsLibrary;
  private readonly _molds: MoldsLibrary;
  private readonly _procedures: ProceduresLibrary;
  private readonly _tasks: TasksLibrary;
  private readonly _confections: Entities.Confections.ConfectionsLibrary;
  private readonly _decorations: DecorationsLibrary;

  // Persistence configuration (set via configurePersistence)
  private _syncProvider: ISyncProvider | undefined;
  private _encryptionProvider:
    | CryptoUtils.IEncryptionProvider
    | (() => CryptoUtils.IEncryptionProvider | undefined)
    | undefined;

  // Singleton caches for persisted collections (one map per sub-library)
  private readonly _persistedIngredients: Map<
    CollectionId,
    PersistedEditableCollection<IngredientEntity, BaseIngredientId>
  > = new Map();
  private readonly _persistedFillings: Map<
    CollectionId,
    PersistedEditableCollection<IFillingRecipeEntity, BaseFillingId>
  > = new Map();
  private readonly _persistedMolds: Map<CollectionId, PersistedEditableCollection<IMoldEntity, BaseMoldId>> =
    new Map();
  private readonly _persistedProcedures: Map<
    CollectionId,
    PersistedEditableCollection<IProcedureEntity, BaseProcedureId>
  > = new Map();
  private readonly _persistedTasks: Map<
    CollectionId,
    PersistedEditableCollection<IRawTaskEntity, BaseTaskId>
  > = new Map();
  private readonly _persistedConfections: Map<
    CollectionId,
    PersistedEditableCollection<Entities.Confections.AnyConfectionRecipeEntity, BaseConfectionId>
  > = new Map();
  private readonly _persistedDecorations: Map<
    CollectionId,
    PersistedEditableCollection<IDecorationEntity, BaseDecorationId>
  > = new Map();

  /**
   * Logger used by this library and its sub-libraries.
   */
  public readonly logger: Logging.LogReporter<unknown>;

  private constructor(
    ingredients: IngredientsLibrary,
    recipes: FillingsLibrary,
    molds: MoldsLibrary,
    procedures: ProceduresLibrary,
    tasks: TasksLibrary,
    confections: Entities.Confections.ConfectionsLibrary,
    decorations: DecorationsLibrary,
    logger?: Logging.ILogger
  ) {
    /* c8 ignore next - default logger branch tested implicitly via create() */
    logger = logger ?? new Logging.NoOpLogger();
    this._ingredients = ingredients;
    this._recipes = recipes;
    this._molds = molds;
    this._procedures = procedures;
    this._tasks = tasks;
    this._confections = confections;
    this._decorations = decorations;
    this.logger = new Logging.LogReporter({ logger });
  }

  /**
   * Creates a new {@link LibraryRuntime.ChocolateEntityLibrary | ChocolateEntityLibrary} instance.
   * @param params - Optional {@link LibraryRuntime.IChocolateEntityLibraryCreateParams | creation parameters}
   * @returns `Success` with new instance, or `Failure` with error message
   * @public
   */
  public static create(params?: IChocolateEntityLibraryCreateParams): Result<ChocolateEntityLibrary> {
    /* c8 ignore next 1 - defensive: params undefined branch tested implicitly */
    params = params ?? {};
    /* c8 ignore next 1 - optional param branches tested implicitly via create() */
    const builtinSpec = params?.builtin ?? true;
    const fileSources = normalizeFileSources(params.fileSources);
    const logger = Logging.LogReporter.createDefault(params.logger).orThrow();

    const ingredientsResult = IngredientsLibrary.create({
      builtin: resolveBuiltInSpec<CollectionId>(builtinSpec, 'ingredients'),
      fileSources: ChocolateEntityLibrary._toFileSources(fileSources, 'ingredients'),
      mergeLibraries: params.libraries?.ingredients,
      logger
    }).report(logger);

    const recipesResult = FillingsLibrary.create({
      builtin: resolveBuiltInSpec<CollectionId>(builtinSpec, 'fillings'),
      fileSources: ChocolateEntityLibrary._toFileSources(fileSources, 'fillings'),
      mergeLibraries: params.libraries?.fillings,
      logger
    }).report(logger);

    const moldsResult = MoldsLibrary.create({
      builtin: resolveBuiltInSpec<CollectionId>(builtinSpec, 'molds'),
      fileSources: ChocolateEntityLibrary._toFileSources(fileSources, 'molds'),
      mergeLibraries: params.libraries?.molds,
      logger
    }).report(logger);

    const proceduresResult = ProceduresLibrary.create({
      builtin: resolveBuiltInSpec<CollectionId>(builtinSpec, 'procedures'),
      fileSources: ChocolateEntityLibrary._toFileSources(fileSources, 'procedures'),
      mergeLibraries: params.libraries?.procedures,
      logger
    }).report(logger);

    const tasksResult = TasksLibrary.create({
      builtin: resolveBuiltInSpec<CollectionId>(builtinSpec, 'tasks'),
      fileSources: ChocolateEntityLibrary._toFileSources(fileSources, 'tasks'),
      mergeLibraries: params.libraries?.tasks,
      logger
    }).report(logger);

    const confectionsResult = Entities.Confections.ConfectionsLibrary.create({
      builtin: resolveBuiltInSpec<CollectionId>(builtinSpec, 'confections'),
      fileSources: ChocolateEntityLibrary._toFileSources(fileSources, 'confections'),
      mergeLibraries: params.libraries?.confections,
      logger
    }).report(logger);

    const decorationsResult = DecorationsLibrary.create({
      builtin: resolveBuiltInSpec<CollectionId>(builtinSpec, 'decorations'),
      fileSources: ChocolateEntityLibrary._toFileSources(fileSources, 'decorations'),
      mergeLibraries: params.libraries?.decorations,
      logger
    }).report(logger);

    return ingredientsResult.onSuccess((ingredients) =>
      recipesResult.onSuccess((recipes) =>
        moldsResult.onSuccess((molds) =>
          proceduresResult.onSuccess((procedures) =>
            tasksResult.onSuccess((tasks) =>
              confectionsResult.onSuccess((confections) =>
                decorationsResult.onSuccess((decorations) => {
                  const library = new ChocolateEntityLibrary(
                    ingredients,
                    recipes,
                    molds,
                    procedures,
                    tasks,
                    confections,
                    decorations,
                    logger.logger
                  );
                  logger.info(
                    `ChocolateEntityLibrary created: ${ingredients.size} ingredients, ${recipes.size} recipes, ${molds.size} molds, ${procedures.size} procedures, ${tasks.size} tasks, ${confections.size} confections, ${decorations.size} decorations`
                  );
                  return Success.with(library);
                })
              )
            )
          )
        )
      )
    );
  }

  /**
   * Converts full library file sources to sub-library-specific file sources
   */
  private static _toFileSources(
    sources: ReadonlyArray<ILibraryFileTreeSource>,
    subLibraryId: SubLibraryId
  ): ReadonlyArray<IFileTreeSource<CollectionId>> {
    return sources.map((source) => ({
      sourceName: source.sourceName,
      directory: source.directory,
      load: resolveBuiltInSpec<CollectionId>(source.load, subLibraryId),
      mutable: source.mutable,
      skipMissingDirectories: source.skipMissingDirectories
    }));
  }

  /**
   * The {@link Entities.Ingredients.IngredientsLibrary | ingredients library}.
   */
  public get ingredients(): IngredientsLibrary {
    return this._ingredients;
  }

  /**
   * The {@link Entities.Fillings.FillingsLibrary | fillings library}.
   */
  public get fillings(): FillingsLibrary {
    return this._recipes;
  }

  /**
   * The {@link Entities.Molds.MoldsLibrary | molds library}.
   */
  public get molds(): MoldsLibrary {
    return this._molds;
  }

  /**
   * The {@link Entities.Procedures.ProceduresLibrary | procedures library}.
   */
  public get procedures(): ProceduresLibrary {
    return this._procedures;
  }

  /**
   * The {@link Entities.Tasks.TasksLibrary | tasks library}.
   */
  public get tasks(): TasksLibrary {
    return this._tasks;
  }

  /**
   * The {@link Entities.Confections.ConfectionsLibrary | confections library}.
   */
  public get confections(): Entities.Confections.ConfectionsLibrary {
    return this._confections;
  }

  /**
   * The {@link Entities.Decorations.DecorationsLibrary | decorations library}.
   */
  public get decorations(): DecorationsLibrary {
    return this._decorations;
  }

  // ==========================================================================
  // Persistence Configuration
  // ==========================================================================

  /**
   * Configure the persistence pipeline for this library.
   *
   * Call this once during app initialization after the workspace and KeyStore
   * are available. Persisted collection wrappers created after this call will
   * use the provided sync and encryption providers.
   *
   * @param config - Persistence configuration
   * @public
   */
  public configurePersistence(config: IPersistenceConfig): void {
    this._syncProvider = config.syncProvider;
    this._encryptionProvider = config.encryptionProvider;
  }

  // ==========================================================================
  // Persisted Collection Singletons
  // ==========================================================================

  /**
   * Get or create a singleton persisted ingredients collection.
   * @param collectionId - ID of the collection
   * @returns `Success` with persisted wrapper, or `Failure` if collection not found
   * @public
   */
  public getPersistedIngredientsCollection(
    collectionId: CollectionId
  ): Result<PersistedEditableCollection<IngredientEntity, BaseIngredientId>> {
    return this._getOrCreatePersisted(
      this._persistedIngredients,
      this.ingredients,
      collectionId,
      CommonConverters.baseIngredientId,
      EntityConverters.Ingredients.ingredientEntity
    );
  }

  /**
   * Get or create a singleton persisted fillings collection.
   * @param collectionId - ID of the collection
   * @returns `Success` with persisted wrapper, or `Failure` if collection not found
   * @public
   */
  public getPersistedFillingsCollection(
    collectionId: CollectionId
  ): Result<PersistedEditableCollection<IFillingRecipeEntity, BaseFillingId>> {
    return this._getOrCreatePersisted(
      this._persistedFillings,
      this.fillings,
      collectionId,
      CommonConverters.baseFillingId,
      EntityConverters.Fillings.fillingRecipeEntity
    );
  }

  /**
   * Get or create a singleton persisted molds collection.
   * @param collectionId - ID of the collection
   * @returns `Success` with persisted wrapper, or `Failure` if collection not found
   * @public
   */
  public getPersistedMoldsCollection(
    collectionId: CollectionId
  ): Result<PersistedEditableCollection<IMoldEntity, BaseMoldId>> {
    return this._getOrCreatePersisted(
      this._persistedMolds,
      this.molds,
      collectionId,
      CommonConverters.baseMoldId,
      EntityConverters.Molds.moldEntity
    );
  }

  /**
   * Get or create a singleton persisted procedures collection.
   * @param collectionId - ID of the collection
   * @returns `Success` with persisted wrapper, or `Failure` if collection not found
   * @public
   */
  public getPersistedProceduresCollection(
    collectionId: CollectionId
  ): Result<PersistedEditableCollection<IProcedureEntity, BaseProcedureId>> {
    return this._getOrCreatePersisted(
      this._persistedProcedures,
      this.procedures,
      collectionId,
      CommonConverters.baseProcedureId,
      EntityConverters.Procedures.procedureEntity
    );
  }

  /**
   * Get or create a singleton persisted tasks collection.
   * @param collectionId - ID of the collection
   * @returns `Success` with persisted wrapper, or `Failure` if collection not found
   * @public
   */
  public getPersistedTasksCollection(
    collectionId: CollectionId
  ): Result<PersistedEditableCollection<IRawTaskEntity, BaseTaskId>> {
    return this._getOrCreatePersisted(
      this._persistedTasks,
      this.tasks,
      collectionId,
      CommonConverters.baseTaskId,
      EntityConverters.Tasks.rawTaskEntity
    );
  }

  /**
   * Get or create a singleton persisted confections collection.
   * @param collectionId - ID of the collection
   * @returns `Success` with persisted wrapper, or `Failure` if collection not found
   * @public
   */
  public getPersistedConfectionsCollection(
    collectionId: CollectionId
  ): Result<PersistedEditableCollection<Entities.Confections.AnyConfectionRecipeEntity, BaseConfectionId>> {
    return this._getOrCreatePersisted(
      this._persistedConfections,
      this.confections,
      collectionId,
      CommonConverters.baseConfectionId,
      EntityConverters.Confections.anyConfectionRawEntity
    );
  }

  /**
   * Get or create a singleton persisted decorations collection.
   * @param collectionId - ID of the collection
   * @returns `Success` with persisted wrapper, or `Failure` if collection not found
   * @public
   */
  public getPersistedDecorationsCollection(
    collectionId: CollectionId
  ): Result<PersistedEditableCollection<IDecorationEntity, BaseDecorationId>> {
    return this._getOrCreatePersisted(
      this._persistedDecorations,
      this.decorations,
      collectionId,
      CommonConverters.baseDecorationId,
      EntityConverters.Decorations.decorationEntity
    );
  }

  // ==========================================================================
  // Entity Save Helpers
  // ==========================================================================

  /**
   * Save a filling recipe entity to a mutable collection.
   *
   * Sets the entity in the SubLibrary (in-memory), then persists to disk
   * via the persisted collection singleton. Fails if persistence is unavailable
   * or if disk save fails.
   *
   * @param collectionId - Target collection (must be mutable)
   * @param baseId - Base filling ID
   * @param entity - The filling recipe entity to save
   * @returns Composite filling ID on success
   * @public
   */
  public async saveFillingRecipe(
    collectionId: CollectionId,
    baseId: BaseFillingId,
    entity: IFillingRecipeEntity
  ): Promise<Result<string>> {
    return this._saveEntityToCollection(
      this.fillings,
      collectionId,
      baseId,
      entity,
      (cid) => this.getPersistedFillingsCollection(cid),
      'filling recipe'
    );
  }

  /**
   * Save an ingredient entity to a mutable collection.
   * @see {@link ChocolateEntityLibrary.saveFillingRecipe | saveFillingRecipe} for behavior details.
   * @public
   */
  public async saveIngredient(
    collectionId: CollectionId,
    baseId: BaseIngredientId,
    entity: IngredientEntity
  ): Promise<Result<string>> {
    return this._saveEntityToCollection(
      this.ingredients,
      collectionId,
      baseId,
      entity,
      (cid) => this.getPersistedIngredientsCollection(cid),
      'ingredient'
    );
  }

  /**
   * Save a procedure entity to a mutable collection.
   * @see {@link ChocolateEntityLibrary.saveFillingRecipe | saveFillingRecipe} for behavior details.
   * @public
   */
  public async saveProcedure(
    collectionId: CollectionId,
    baseId: BaseProcedureId,
    entity: IProcedureEntity
  ): Promise<Result<string>> {
    return this._saveEntityToCollection(
      this.procedures,
      collectionId,
      baseId,
      entity,
      (cid) => this.getPersistedProceduresCollection(cid),
      'procedure'
    );
  }

  /**
   * Save a mold entity to a mutable collection.
   * @see {@link ChocolateEntityLibrary.saveFillingRecipe | saveFillingRecipe} for behavior details.
   * @public
   */
  public async saveMold(
    collectionId: CollectionId,
    baseId: BaseMoldId,
    entity: IMoldEntity
  ): Promise<Result<string>> {
    return this._saveEntityToCollection(
      this.molds,
      collectionId,
      baseId,
      entity,
      (cid) => this.getPersistedMoldsCollection(cid),
      'mold'
    );
  }

  /**
   * Save a task entity to a mutable collection.
   * @see {@link ChocolateEntityLibrary.saveFillingRecipe | saveFillingRecipe} for behavior details.
   * @public
   */
  public async saveTask(
    collectionId: CollectionId,
    baseId: BaseTaskId,
    entity: IRawTaskEntity
  ): Promise<Result<string>> {
    return this._saveEntityToCollection(
      this.tasks,
      collectionId,
      baseId,
      entity,
      (cid) => this.getPersistedTasksCollection(cid),
      'task'
    );
  }

  /**
   * Save a confection recipe entity to a mutable collection.
   * @see {@link ChocolateEntityLibrary.saveFillingRecipe | saveFillingRecipe} for behavior details.
   * @public
   */
  public async saveConfectionRecipe(
    collectionId: CollectionId,
    baseId: BaseConfectionId,
    entity: Entities.Confections.AnyConfectionRecipeEntity
  ): Promise<Result<string>> {
    return this._saveEntityToCollection(
      this.confections,
      collectionId,
      baseId,
      entity,
      (cid) => this.getPersistedConfectionsCollection(cid),
      'confection recipe'
    );
  }

  /**
   * Save a decoration entity to a mutable collection.
   * @see {@link ChocolateEntityLibrary.saveFillingRecipe | saveFillingRecipe} for behavior details.
   * @public
   */
  public async saveDecoration(
    collectionId: CollectionId,
    baseId: BaseDecorationId,
    entity: IDecorationEntity
  ): Promise<Result<string>> {
    return this._saveEntityToCollection(
      this.decorations,
      collectionId,
      baseId,
      entity,
      (cid) => this.getPersistedDecorationsCollection(cid),
      'decoration'
    );
  }

  // ==========================================================================
  // Ephemeral Editable Collections (legacy — use getPersisted* for new code)
  // ==========================================================================

  /**
   * Get an editable ingredients collection with persistence enabled.
   * @param collectionId - ID of the collection to make editable
   * @param encryptionProvider - Optional encryption provider for encrypted save support
   * @returns Result containing EditableCollection with persistence, or Failure
   * @public
   */
  public getEditableIngredientsEntityCollection(
    collectionId: CollectionId,
    encryptionProvider?: CryptoUtils.IEncryptionProvider
  ): Result<EditableCollection<IngredientEntity, BaseIngredientId>> {
    return EditableCollection.fromLibrary(
      this.ingredients,
      collectionId,
      CommonConverters.baseIngredientId,
      EntityConverters.Ingredients.ingredientEntity,
      encryptionProvider
    );
  }

  /**
   * Get an editable fillings collection with persistence enabled.
   * @param collectionId - ID of the collection to make editable
   * @param encryptionProvider - Optional encryption provider for encrypted save support
   * @returns Result containing EditableCollection with persistence, or Failure
   * @public
   */
  public getEditableFillingsRecipeEntityCollection(
    collectionId: CollectionId,
    encryptionProvider?: CryptoUtils.IEncryptionProvider
  ): Result<EditableCollection<IFillingRecipeEntity, BaseFillingId>> {
    return EditableCollection.fromLibrary(
      this.fillings,
      collectionId,
      CommonConverters.baseFillingId,
      EntityConverters.Fillings.fillingRecipeEntity,
      encryptionProvider
    );
  }

  /**
   * Get an editable molds collection with persistence enabled.
   * @param collectionId - ID of the collection to make editable
   * @param encryptionProvider - Optional encryption provider for encrypted save support
   * @returns Result containing EditableCollection with persistence, or Failure
   * @public
   */
  public getEditableMoldsEntityCollection(
    collectionId: CollectionId,
    encryptionProvider?: CryptoUtils.IEncryptionProvider
  ): Result<EditableCollection<IMoldEntity, BaseMoldId>> {
    return EditableCollection.fromLibrary(
      this.molds,
      collectionId,
      CommonConverters.baseMoldId,
      EntityConverters.Molds.moldEntity,
      encryptionProvider
    );
  }

  /**
   * Get an editable procedures collection with persistence enabled.
   * @param collectionId - ID of the collection to make editable
   * @param encryptionProvider - Optional encryption provider for encrypted save support
   * @returns Result containing EditableCollection with persistence, or Failure
   * @public
   */
  public getEditableProceduresEntityCollection(
    collectionId: CollectionId,
    encryptionProvider?: CryptoUtils.IEncryptionProvider
  ): Result<EditableCollection<IProcedureEntity, BaseProcedureId>> {
    return EditableCollection.fromLibrary(
      this.procedures,
      collectionId,
      CommonConverters.baseProcedureId,
      EntityConverters.Procedures.procedureEntity,
      encryptionProvider
    );
  }

  /**
   * Get an editable tasks collection with persistence enabled.
   * @param collectionId - ID of the collection to make editable
   * @param encryptionProvider - Optional encryption provider for encrypted save support
   * @returns Result containing EditableCollection with persistence, or Failure
   * @public
   */
  public getEditableTasksEntityCollection(
    collectionId: CollectionId,
    encryptionProvider?: CryptoUtils.IEncryptionProvider
  ): Result<EditableCollection<IRawTaskEntity, BaseTaskId>> {
    return EditableCollection.fromLibrary(
      this.tasks,
      collectionId,
      CommonConverters.baseTaskId,
      EntityConverters.Tasks.rawTaskEntity,
      encryptionProvider
    );
  }

  /**
   * Get an editable confections collection with persistence enabled.
   * @param collectionId - ID of the collection to make editable
   * @param encryptionProvider - Optional encryption provider for encrypted save support
   * @returns Result containing EditableCollection with persistence, or Failure
   * @public
   */
  public getEditableConfectionsEntityCollection(
    collectionId: CollectionId,
    encryptionProvider?: CryptoUtils.IEncryptionProvider
  ): Result<EditableCollection<Entities.Confections.AnyConfectionRecipeEntity, BaseConfectionId>> {
    return EditableCollection.fromLibrary(
      this.confections,
      collectionId,
      CommonConverters.baseConfectionId,
      EntityConverters.Confections.anyConfectionRawEntity,
      encryptionProvider
    );
  }

  /**
   * Get an editable decorations collection with persistence enabled.
   * @param collectionId - ID of the collection to make editable
   * @param encryptionProvider - Optional encryption provider for encrypted save support
   * @returns Result containing EditableCollection with persistence, or Failure
   * @public
   */
  public getEditableDecorationsEntityCollection(
    collectionId: CollectionId,
    encryptionProvider?: CryptoUtils.IEncryptionProvider
  ): Result<EditableCollection<IDecorationEntity, BaseDecorationId>> {
    return EditableCollection.fromLibrary(
      this.decorations,
      collectionId,
      CommonConverters.baseDecorationId,
      EntityConverters.Decorations.decorationEntity,
      encryptionProvider
    );
  }

  // ==========================================================================
  // Generic Collection Persistence
  // ==========================================================================

  /**
   * Save a collection's current in-memory state to its backing file tree.
   *
   * Uses the persisted collection singleton if available, otherwise falls
   * back to the ephemeral snapshot pattern. When using persisted singletons,
   * the full save pipeline (FileTree write + disk sync) is handled automatically.
   *
   * @remarks
   * When a collection ID exists in multiple sub-libraries (e.g. `"common"`),
   * pass `subLibrary` to disambiguate. Without it the method picks the first
   * match in iteration order, which may not be the sub-library that was
   * actually mutated.
   *
   * @param collectionId - Collection to persist
   * @param encryptionProvider - Optional encryption provider for encrypted collections
   * @param subLibrary - Optional sub-library hint to disambiguate shared collection IDs
   * @returns Result with `true` on success, or Failure with context
   * @public
   */
  public async saveCollection(
    collectionId: CollectionId,
    encryptionProvider?: CryptoUtils.IEncryptionProvider,
    subLibrary?: { collections: { has(id: CollectionId): boolean } }
  ): Promise<Result<true>> {
    // When subLibrary is provided, use identity to find the correct match
    const match = subLibrary
      ? (lib: { collections: { has(id: CollectionId): boolean } }): boolean =>
          lib === subLibrary && lib.collections.has(collectionId)
      : (lib: { collections: { has(id: CollectionId): boolean } }): boolean =>
          lib.collections.has(collectionId);

    if (match(this.ingredients)) {
      return this._savePersisted(this.getPersistedIngredientsCollection(collectionId));
    }
    if (match(this.fillings)) {
      return this._savePersisted(this.getPersistedFillingsCollection(collectionId));
    }
    if (match(this.molds)) {
      return this._savePersisted(this.getPersistedMoldsCollection(collectionId));
    }
    if (match(this.procedures)) {
      return this._savePersisted(this.getPersistedProceduresCollection(collectionId));
    }
    if (match(this.tasks)) {
      return this._savePersisted(this.getPersistedTasksCollection(collectionId));
    }
    if (match(this.confections)) {
      return this._savePersisted(this.getPersistedConfectionsCollection(collectionId));
    }
    if (match(this.decorations)) {
      return this._savePersisted(this.getPersistedDecorationsCollection(collectionId));
    }
    return fail(`Collection '${collectionId}' not found in any sub-library`);
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  /**
   * Get or create a singleton persisted collection wrapper.
   * @internal
   */
  private _getOrCreatePersisted<T, TBaseId extends string>(
    cache: Map<CollectionId, PersistedEditableCollection<T, TBaseId>>,
    subLibrary: SubLibraryBase<string, TBaseId, T>,
    collectionId: CollectionId,
    keyConverter: Converter<TBaseId, unknown>,
    valueConverter: Converter<T, unknown>
  ): Result<PersistedEditableCollection<T, TBaseId>> {
    // Verify the collection exists before creating a wrapper
    if (!subLibrary.collections.has(collectionId)) {
      return fail(`Collection "${collectionId}" not found`);
    }

    let cached = cache.get(collectionId);
    if (!cached) {
      cached = new PersistedEditableCollection({
        subLibrary,
        collectionId,
        keyConverter,
        valueConverter,
        syncProvider: this._syncProvider,
        encryptionProvider: this._encryptionProvider
      });
      cache.set(collectionId, cached);
    }
    return succeed(cached);
  }

  /**
   * Save a persisted collection wrapper, handling the Result unwrap.
   * @internal
   */
  private async _savePersisted<T, TBaseId extends string>(
    persistedResult: Result<PersistedEditableCollection<T, TBaseId>>
  ): Promise<Result<true>> {
    if (persistedResult.isFailure()) {
      return fail(persistedResult.message);
    }
    return persistedResult.value.save();
  }

  /**
   * Generic implementation for saving an entity to a mutable collection.
   *
   * 1. Looks up the collection and verifies it is mutable.
   * 2. Sets the entity in the SubLibrary (in-memory mutation).
   * 3. Persists via the persisted collection singleton (disk write).
   *
   * If (3) fails, the entity is still in memory but the result is a failure.
   *
   * @internal
   */
  private async _saveEntityToCollection<TCompositeId extends string, TBaseId extends string, TEntity>(
    subLibrary: SubLibraryBase<TCompositeId, TBaseId, TEntity>,
    collectionId: CollectionId,
    baseId: TBaseId,
    entity: TEntity,
    getPersisted: (collectionId: CollectionId) => Result<PersistedEditableCollection<TEntity, TBaseId>>,
    entityLabel: string
  ): Promise<Result<string>> {
    // 1. Look up collection and verify mutability
    const collectionResult = subLibrary.collections.get(collectionId);
    if (collectionResult.isFailure()) {
      return fail(`${entityLabel}: collection '${collectionId}' not found: ${collectionResult.message}`);
    }

    const collection = collectionResult.value;
    if (!collection.isMutable) {
      return fail(`${entityLabel}: collection '${collectionId}' is not mutable`);
    }

    // 2. Set the entity in the SubLibrary (in-memory)
    const setResult = collection.items.set(baseId, entity);
    if (setResult.isFailure()) {
      return fail(
        `${entityLabel}: failed to set '${baseId}' in collection '${collectionId}': ${setResult.message}`
      );
    }

    // 3. Compute composite ID
    const compositeIdResult = subLibrary.composeId(collectionId, baseId);
    if (compositeIdResult.isFailure()) {
      return fail(
        `${entityLabel}: failed to compose ID for '${collectionId}.${baseId}': ${compositeIdResult.message}`
      );
    }
    const compositeId = compositeIdResult.value as string;

    // 4. Persist to disk — fail if persistence is unavailable or fails
    const persistedResult = getPersisted(collectionId);
    if (persistedResult.isFailure()) {
      return fail(
        `Saved ${entityLabel} '${compositeId}' in memory but persistence unavailable: ${persistedResult.message}`
      );
    }

    const saveResult = await persistedResult.value.save();
    if (saveResult.isFailure()) {
      return fail(
        `Saved ${entityLabel} '${compositeId}' in memory but disk save failed: ${saveResult.message}`
      );
    }

    return succeed(compositeId);
  }
}
