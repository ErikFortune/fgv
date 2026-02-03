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
 * Main ChocolateLibrary class - unified access to ingredients and recipes
 * @packageDocumentation
 */

import { Logging, Result, Success } from '@fgv/ts-utils';

import {
  ConfectionId,
  Converters as CommonConverters,
  IngredientId,
  MoldId,
  ProcedureId,
  FillingId,
  FillingVersionSpec,
  SourceId,
  TaskId,
  BaseIngredientId,
  BaseFillingId,
  BaseMoldId,
  BaseProcedureId,
  BaseTaskId,
  BaseConfectionId
} from '../common';
import * as Entities from '../entities';
import { Ingredient, IngredientsLibrary } from '../entities';
import { IFillingRecipe, FillingsLibrary } from '../entities';
import { Converters as EntityConverters } from '../entities';
import { IMold, MoldsLibrary } from '../entities';
import { IProcedure, ProceduresLibrary } from '../entities';
import { ITaskData, TasksLibrary } from '../entities';
import { IGanacheCalculation, IngredientResolver } from './model';
import { calculateGanache } from './internal';
import { EditableCollection } from '../editing';
import {
  FullLibraryLoadSpec,
  IFileTreeSource,
  ILibraryFileTreeSource,
  normalizeFileSources,
  resolveBuiltInSpec,
  SubLibraryId
} from '../library-data';

// ============================================================================
// Parameters Interface
// ============================================================================

/**
 * Pre-built library instances to include in a {@link LibraryRuntime.ChocolateLibrary | ChocolateLibrary}.
 * Useful for testing or when libraries are constructed through other means.
 * @public
 */
export interface IInstantiatedLibrarySource {
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
}

/**
 * Parameters for creating a {@link LibraryRuntime.ChocolateLibrary | ChocolateLibrary}.
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
export interface IChocolateLibraryCreateParams {
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
  readonly libraries?: IInstantiatedLibrarySource;

  /**
   * Optional logger for reporting load/merge issues.
   */
  readonly logger?: Logging.LogReporter<unknown>;
}

// ============================================================================
// ChocolateLibrary Class
// ============================================================================

/**
 * Main entry point for the chocolate library
 *
 * Provides unified access to:
 * - Ingredient management (multi-source with built-ins)
 * - Recipe management (multi-source)
 * - Recipe scaling
 * - Ganache characteristic calculations
 *
 * @public
 */
export class ChocolateLibrary {
  private readonly _ingredients: IngredientsLibrary;
  private readonly _recipes: FillingsLibrary;
  private readonly _molds: MoldsLibrary;
  private readonly _procedures: ProceduresLibrary;
  private readonly _tasks: TasksLibrary;
  private readonly _confections: Entities.Confections.ConfectionsLibrary;

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
    this.logger = new Logging.LogReporter({ logger });
  }

  /**
   * Creates a new {@link LibraryRuntime.ChocolateLibrary | ChocolateLibrary} instance.
   * @param params - Optional {@link LibraryRuntime.IChocolateLibraryCreateParams | creation parameters}
   * @returns `Success` with new instance, or `Failure` with error message
   * @public
   */
  public static create(params?: IChocolateLibraryCreateParams): Result<ChocolateLibrary> {
    params = params ?? {};
    /* c8 ignore next 1 - optional param branches tested implicitly via create() */
    const builtinSpec = params?.builtin ?? true;
    const fileSources = normalizeFileSources(params.fileSources);
    /* c8 ignore next - default logger branch tested implicitly */
    const logger = params.logger ?? Logging.LogReporter.createDefault().orThrow();

    const ingredientsResult = IngredientsLibrary.create({
      builtin: resolveBuiltInSpec<SourceId>(builtinSpec, 'ingredients'),
      fileSources: ChocolateLibrary._toFileSources(fileSources, 'ingredients'),
      mergeLibraries: params.libraries?.ingredients,
      logger
    }).report(logger);

    const recipesResult = FillingsLibrary.create({
      builtin: resolveBuiltInSpec<SourceId>(builtinSpec, 'fillings'),
      fileSources: ChocolateLibrary._toFileSources(fileSources, 'fillings'),
      mergeLibraries: params.libraries?.fillings,
      logger
    }).report(logger);

    const moldsResult = MoldsLibrary.create({
      builtin: resolveBuiltInSpec<SourceId>(builtinSpec, 'molds'),
      fileSources: ChocolateLibrary._toFileSources(fileSources, 'molds'),
      mergeLibraries: params.libraries?.molds,
      logger
    }).report(logger);

    const proceduresResult = ProceduresLibrary.create({
      builtin: resolveBuiltInSpec<SourceId>(builtinSpec, 'procedures'),
      fileSources: ChocolateLibrary._toFileSources(fileSources, 'procedures'),
      mergeLibraries: params.libraries?.procedures,
      logger
    }).report(logger);

    const tasksResult = TasksLibrary.create({
      builtin: resolveBuiltInSpec<SourceId>(builtinSpec, 'tasks'),
      fileSources: ChocolateLibrary._toFileSources(fileSources, 'tasks'),
      mergeLibraries: params.libraries?.tasks,
      logger
    }).report(logger);

    const confectionsResult = Entities.Confections.ConfectionsLibrary.create({
      builtin: resolveBuiltInSpec<SourceId>(builtinSpec, 'confections'),
      fileSources: ChocolateLibrary._toFileSources(fileSources, 'confections'),
      mergeLibraries: params.libraries?.confections,
      logger
    }).report(logger);

    return ingredientsResult.onSuccess((ingredients) =>
      recipesResult.onSuccess((recipes) =>
        moldsResult.onSuccess((molds) =>
          proceduresResult.onSuccess((procedures) =>
            tasksResult.onSuccess((tasks) =>
              confectionsResult.onSuccess((confections) => {
                const library = new ChocolateLibrary(
                  ingredients,
                  recipes,
                  molds,
                  procedures,
                  tasks,
                  confections,
                  logger.logger
                );
                logger.info(
                  `ChocolateLibrary created: ${ingredients.size} ingredients, ${recipes.size} recipes, ${molds.size} molds, ${procedures.size} procedures, ${tasks.size} tasks, ${confections.size} confections`
                );
                return Success.with(library);
              })
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
  ): ReadonlyArray<IFileTreeSource<SourceId>> {
    return sources.map((source) => ({
      directory: source.directory,
      load: resolveBuiltInSpec<SourceId>(source.load, subLibraryId),
      mutable: source.mutable
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
   * Gets an {@link Entities.Ingredients.Ingredient | ingredient} by its {@link IngredientId | composite ID}
   * @param id - The {@link IngredientId | id} of the ingredient to retrieve.
   * @returns `Success` with ingredient, or `Failure` if not found
   */
  public getIngredient(id: IngredientId): Result<Ingredient> {
    return this._ingredients.get(id);
  }

  /**
   * Checks if an ingredient exists
   * @param id - The {@link IngredientId | id} of the ingredient to check.
   * @returns `true` if the ingredient exists
   */
  public hasIngredient(id: IngredientId): boolean {
    return this._ingredients.has(id);
  }

  /**
   * Gets a {@link Entities.Fillings.IFillingRecipe | recipe} by its {@link FillingId | composite ID}
   * @param id - The {@link FillingId | id} of the recipe to retrieve.
   * @returns `Success` with recipe, or `Failure` if not found
   */
  public getRecipe(id: FillingId): Result<IFillingRecipe> {
    return this._recipes.get(id);
  }

  /**
   * Checks if a recipe exists
   * @param id - The {@link FillingId | id} of the recipe to check.
   * @returns `true` if the recipe exists
   */
  public hasRecipe(id: FillingId): boolean {
    return this._recipes.has(id);
  }

  /**
   * Gets a {@link Entities.Molds.IMold | mold} by its {@link MoldId | composite ID}
   * @param id - The {@link MoldId | id} of the mold to retrieve.
   * @returns `Success` with mold data, or `Failure` if not found
   */
  public getMold(id: MoldId): Result<IMold> {
    return this._molds.get(id);
  }

  /**
   * Checks if a mold exists
   * @param id - The {@link MoldId | id} of the mold to check.
   * @returns `true` if the mold exists
   */
  public hasMold(id: MoldId): boolean {
    return this._molds.has(id);
  }

  /**
   * Gets a {@link Entities.Procedures.IProcedure | procedure} by its {@link ProcedureId | composite ID}
   * @param id - The {@link ProcedureId | id} of the procedure to retrieve.
   * @returns `Success` with procedure, or `Failure` if not found
   */
  public getProcedure(id: ProcedureId): Result<IProcedure> {
    return this._procedures.get(id);
  }

  /**
   * Checks if a procedure exists
   * @param id - The {@link ProcedureId | id} of the procedure to check.
   * @returns `true` if the procedure exists
   */
  public hasProcedure(id: ProcedureId): boolean {
    return this._procedures.has(id);
  }

  /**
   * Gets a {@link Entities.Tasks.ITaskData | task} by its {@link TaskId | composite ID}
   * @param id - The {@link TaskId | id} of the task to retrieve.
   * @returns `Success` with task data, or `Failure` if not found
   */
  public getTask(id: TaskId): Result<ITaskData> {
    return this._tasks.get(id);
  }

  /**
   * Checks if a task exists
   * @param id - The {@link TaskId | id} of the task to check.
   * @returns `true` if the task exists
   */
  public hasTask(id: TaskId): boolean {
    return this._tasks.has(id);
  }

  /**
   * Gets a {@link Entities.Confections.AnyConfection | confection} by its {@link ConfectionId | composite ID}
   * @param id - The {@link ConfectionId | id} of the confection to retrieve.
   * @returns `Success` with confection data, or `Failure` if not found
   */
  public getConfection(id: ConfectionId): Result<Entities.Confections.AnyConfection> {
    return this._confections.get(id);
  }

  /**
   * Checks if a confection exists
   * @param id - The {@link ConfectionId | id} of the confection to check.
   * @returns `true` if the confection exists
   */
  public hasConfection(id: ConfectionId): boolean {
    return this._confections.has(id);
  }

  // ============================================================================
  // Ganache calculations
  // ============================================================================

  /**
   * Creates an ingredient resolver that looks up ingredients from this library
   * @returns Ingredient resolver function
   */
  public createIngredientResolver(): IngredientResolver {
    return (id: IngredientId): Result<Ingredient> => this.getIngredient(id);
  }

  /**
   * Calculates ganache characteristics for a recipe
   *
   * @param id - Recipe ID to analyze
   * @param versionSpec - Optional version ID (default: golden version)
   * @returns Success with ganache calculation, or Failure if recipe not found or ingredients missing
   */
  public calculateGanache(id: FillingId, versionSpec?: FillingVersionSpec): Result<IGanacheCalculation> {
    return this.getRecipe(id).onSuccess((recipe) =>
      calculateGanache(recipe, this.createIngredientResolver(), versionSpec)
    );
  }

  /**
   * Calculates ganache characteristics for a recipe object
   * Useful when working with recipes not yet added to the library
   *
   * @param recipe - Recipe to analyze
   * @param versionSpec - Optional version ID (default: golden version)
   * @returns Success with ganache calculation, or Failure if ingredients missing
   */
  public calculateGanacheForRecipe(
    recipe: IFillingRecipe,
    versionSpec?: FillingVersionSpec
  ): Result<IGanacheCalculation> {
    return calculateGanache(recipe, this.createIngredientResolver(), versionSpec);
  }

  // ============================================================================
  // Editable Collection Convenience Methods
  // ============================================================================

  /**
   * Get an editable ingredients collection with persistence enabled.
   * @param collectionId - ID of the collection to make editable
   * @returns Result containing EditableCollection with persistence, or Failure
   * @public
   */
  public getEditableIngredients(
    collectionId: SourceId
  ): Result<EditableCollection<Ingredient, BaseIngredientId>> {
    return EditableCollection.fromLibrary(
      this.ingredients,
      collectionId,
      CommonConverters.baseIngredientId,
      EntityConverters.Ingredients.ingredient
    );
  }

  /**
   * Get an editable fillings collection with persistence enabled.
   * @param collectionId - ID of the collection to make editable
   * @returns Result containing EditableCollection with persistence, or Failure
   * @public
   */
  public getEditableFillings(
    collectionId: SourceId
  ): Result<EditableCollection<IFillingRecipe, BaseFillingId>> {
    return EditableCollection.fromLibrary(
      this.fillings,
      collectionId,
      CommonConverters.baseFillingId,
      EntityConverters.Fillings.fillingRecipe
    );
  }

  /**
   * Get an editable molds collection with persistence enabled.
   * @param collectionId - ID of the collection to make editable
   * @returns Result containing EditableCollection with persistence, or Failure
   * @public
   */
  public getEditableMolds(collectionId: SourceId): Result<EditableCollection<IMold, BaseMoldId>> {
    return EditableCollection.fromLibrary(
      this.molds,
      collectionId,
      CommonConverters.baseMoldId,
      EntityConverters.Molds.moldData
    );
  }

  /**
   * Get an editable procedures collection with persistence enabled.
   * @param collectionId - ID of the collection to make editable
   * @returns Result containing EditableCollection with persistence, or Failure
   * @public
   */
  public getEditableProcedures(
    collectionId: SourceId
  ): Result<EditableCollection<IProcedure, BaseProcedureId>> {
    return EditableCollection.fromLibrary(
      this.procedures,
      collectionId,
      CommonConverters.baseProcedureId,
      EntityConverters.Procedures.procedureData
    );
  }

  /**
   * Get an editable tasks collection with persistence enabled.
   * @param collectionId - ID of the collection to make editable
   * @returns Result containing EditableCollection with persistence, or Failure
   * @public
   */
  public getEditableTasks(collectionId: SourceId): Result<EditableCollection<ITaskData, BaseTaskId>> {
    return EditableCollection.fromLibrary(
      this.tasks,
      collectionId,
      CommonConverters.baseTaskId,
      EntityConverters.Tasks.taskData
    );
  }

  /**
   * Get an editable confections collection with persistence enabled.
   * @param collectionId - ID of the collection to make editable
   * @returns Result containing EditableCollection with persistence, or Failure
   * @public
   */
  public getEditableConfections(
    collectionId: SourceId
  ): Result<EditableCollection<Entities.Confections.AnyConfection, BaseConfectionId>> {
    return EditableCollection.fromLibrary(
      this.confections,
      collectionId,
      CommonConverters.baseConfectionId,
      EntityConverters.Confections.anyConfectionRaw
    );
  }
}
