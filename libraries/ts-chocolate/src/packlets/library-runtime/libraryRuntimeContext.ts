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
 * LibraryRuntimeContext - central hub for the library-runtime object access layer
 * @packageDocumentation
 */

import { Failure, Logging, Result, Success } from '@fgv/ts-utils';

import { ConfectionId, IngredientId, Model, MoldId, ProcedureId, FillingId, TaskId } from '../common';
import {
  Confections,
  Fillings,
  IngredientEntity,
  IMoldEntity,
  IProcedureEntity,
  IRawTaskEntity
} from '../entities';
import { AnyConfection, Confection } from './confections';
import { IWeightCalculationContext } from './internal';
import { ChocolateLibrary, IChocolateLibraryCreateParams } from './chocolateLibrary';
import {
  IConfectionContext,
  IIngredientContext,
  IIngredientUsageInfo,
  ILibraryRuntimeContext,
  IResolvedAdditionalChocolate,
  IResolvedChocolateSpec,
  IResolvedCoatingOption,
  IResolvedCoatings,
  IResolvedConfectionMoldRef,
  IResolvedConfectionProcedure,
  IResolvedFillingOption,
  IResolvedFillingSlot,
  IChocolateIngredient,
  IIngredient,
  IFillingRecipe,
  IVersionContext
} from './model';
import { RuntimeReverseIndex } from './runtimeReverseIndex';
import { Ingredient, AnyIngredient } from './ingredients';
import { FillingRecipe } from './fillings';
import {
  IIngredientQuerySpec,
  IFillingRecipeQuerySpec,
  IngredientIndexerOrchestrator,
  FillingRecipeIndexerOrchestrator
} from './indexers';
import { MaterializedLibrary } from './materializedLibrary';
import { ITaskContext, Task } from './tasks';
import { IProcedureContext, Procedure } from './procedures';
import { IMoldContext, Mold } from './molds';

// ============================================================================
// LibraryRuntimeContext Parameters
// ============================================================================

/**
 * Parameters for creating a LibraryRuntimeContext with a new library
 * @public
 */
export interface ILibraryRuntimeContextCreateParams {
  /**
   * Parameters for creating the underlying ChocolateLibrary
   */
  readonly libraryParams?: IChocolateLibraryCreateParams;

  /**
   * Whether to pre-warm the reverse index on context creation.
   * @defaultValue false
   */
  readonly preWarm?: boolean;
}

// ============================================================================
// LibraryRuntimeContext Class
// ============================================================================

/**
 * Central context for the library-runtime object access layer.
 * Provides factory methods for runtime objects, caching, and reverse lookups.
 *
 * This is the entry point for consumers who want resolved views
 * of recipes and ingredients with automatic reference resolution.
 *
 * For session creation capabilities, use RuntimeContext from the runtime packlet.
 *
 * @public
 */
export class LibraryRuntimeContext
  implements
    IVersionContext<AnyIngredient>,
    IIngredientContext,
    ITaskContext,
    IProcedureContext,
    IMoldContext,
    IConfectionContext,
    ILibraryRuntimeContext
{
  private readonly _library: ChocolateLibrary;
  private readonly _reverseIndex: RuntimeReverseIndex;

  /**
   * Logger used by this runtime context and its libraries.
   */
  public readonly logger: Logging.LogReporter<unknown>;

  // Materialized libraries with lazy resolution, caching, and integrated find support
  private _ingredients:
    | MaterializedLibrary<IngredientId, IngredientEntity, AnyIngredient, IIngredientQuerySpec>
    | undefined;
  private _recipes:
    | MaterializedLibrary<FillingId, Fillings.IFillingRecipeEntity, FillingRecipe, IFillingRecipeQuerySpec>
    | undefined;
  private _tasks: MaterializedLibrary<TaskId, IRawTaskEntity, Task, never> | undefined;
  private _procedures: MaterializedLibrary<ProcedureId, IProcedureEntity, Procedure, never> | undefined;
  private _molds: MaterializedLibrary<MoldId, IMoldEntity, Mold, never> | undefined;
  private _confections:
    | MaterializedLibrary<ConfectionId, Confections.AnyConfectionEntity, AnyConfection, never>
    | undefined;

  // Extensible indexer orchestrators
  private readonly _recipeOrchestrator: FillingRecipeIndexerOrchestrator;
  private readonly _ingredientOrchestrator: IngredientIndexerOrchestrator;

  protected constructor(library: ChocolateLibrary, preWarm: boolean) {
    this._library = library;
    this.logger = library.logger;

    this._reverseIndex = new RuntimeReverseIndex(library);

    // Initialize orchestrators with resolver functions bound to this context
    // Orchestrators get logger from library automatically
    this._recipeOrchestrator = new FillingRecipeIndexerOrchestrator(
      library,
      (id) => this.fillings.get(id).asResult
    );
    this._ingredientOrchestrator = new IngredientIndexerOrchestrator(
      library,
      (id) => this.ingredients.get(id).asResult
    );

    if (preWarm) {
      this._reverseIndex.warmUp();
      this._recipeOrchestrator.warmUp();
      this._ingredientOrchestrator.warmUp();
    }
  }

  /**
   * Creates a LibraryRuntimeContext with a new or default ChocolateLibrary.
   * This is the primary factory method for most use cases.
   * @param params - Optional parameters for library and caching
   * @returns Success with LibraryRuntimeContext, or Failure if library creation fails
   */
  public static create(params?: ILibraryRuntimeContextCreateParams): Result<LibraryRuntimeContext> {
    return ChocolateLibrary.create(params?.libraryParams).onSuccess((library) => {
      return Success.with(new LibraryRuntimeContext(library, params?.preWarm ?? false));
    });
  }

  /**
   * Creates a LibraryRuntimeContext wrapping an existing ChocolateLibrary.
   * Use this when you already have a configured library instance.
   * @param library - The ChocolateLibrary to wrap
   * @param preWarm - Whether to pre-warm the reverse index
   * @returns Success with LibraryRuntimeContext
   */
  public static fromLibrary(library: ChocolateLibrary, preWarm?: boolean): Result<LibraryRuntimeContext> {
    return Success.with(new LibraryRuntimeContext(library, preWarm ?? false));
  }

  // ============================================================================
  // Library Access
  // ============================================================================

  /**
   * {@inheritDoc LibraryRuntime.ILibraryRuntimeContext.library}
   */
  public get library(): ChocolateLibrary {
    return this._library;
  }

  // ============================================================================
  // Confections
  // ============================================================================

  /**
   * The confections library for accessing confection data.
   */
  public get confections(): Confections.ConfectionsLibrary {
    return this._library.confections;
  }

  /**
   * Gets a confection by ID.
   * @param id - The confection ID
   * @returns Success with confection data, or Failure if not found
   */
  public getConfection(id: ConfectionId): Result<Confections.AnyConfectionEntity> {
    return this._library.getConfection(id);
  }

  /**
   * Checks if a confection exists.
   * @param id - The confection ID to check
   * @returns true if the confection exists
   */
  public hasConfection(id: ConfectionId): boolean {
    return this._library.hasConfection(id);
  }

  /**
   * Gets a runtime confection by ID (with lazy resolution and caching).
   * @param id - The confection ID
   * @returns Success with runtime confection, or Failure if not found
   */
  public getRuntimeConfection(id: ConfectionId): Result<AnyConfection> {
    return this._getConfections().get(id).asResult;
  }

  /**
   * Gets all runtime confections as an iterable map.
   * Confections are resolved lazily and cached on first access.
   * @returns Read-only map of confection IDs to runtime confections
   * @throws Error if confection resolution fails (indicates library corruption)
   */
  public get runtimeConfections(): MaterializedLibrary<
    ConfectionId,
    Confections.AnyConfectionEntity,
    AnyConfection,
    never
  > {
    return this._getConfections();
  }

  /**
   * Gets or creates the materialized confections library.
   * @internal
   */
  private _getConfections(): MaterializedLibrary<
    ConfectionId,
    Confections.AnyConfectionEntity,
    AnyConfection,
    never
  > {
    if (!this._confections) {
      this._confections = new MaterializedLibrary({
        inner: this._library.confections,
        converter: (entity, id) => Confection.create(this, id, entity),
        logger: this.logger
      });
    }
    return this._confections;
  }

  // ============================================================================
  // Resolution Helpers (IConfectionContext)
  // ============================================================================

  /**
   * Resolves a chocolate specification to runtime ingredient objects.
   * @param spec - The raw chocolate specification
   * @param confectionId - The confection ID (for error messages)
   * @returns Resolved chocolate specification with primary chocolate + alternates
   */
  public resolveChocolateSpec(
    spec: Confections.IChocolateSpec,
    confectionId: ConfectionId
  ): IResolvedChocolateSpec {
    // Determine primary chocolate ID (preferredId if set, otherwise first in list)
    /* c8 ignore next - branch: preferredId set vs not set */
    const primaryId = spec.preferredId ?? spec.ids[0];
    const primaryResult = this.getRuntimeIngredient(primaryId);

    // Primary chocolate must resolve successfully - throw if not
    /* c8 ignore next 3 - defensive: library validation ensures chocolate ingredients exist */
    if (primaryResult.isFailure() || !primaryResult.value.isChocolate()) {
      throw new Error(`Failed to resolve primary chocolate ${primaryId} for confection ${confectionId}`);
    }

    const chocolate = primaryResult.value;

    // Resolve alternates (excluding primary)
    const alternates: IChocolateIngredient[] = [];
    for (const id of spec.ids) {
      /* c8 ignore next 6 - defensive: skip alternates that fail to resolve or aren't chocolate */
      if (id !== primaryId) {
        const altResult = this.getRuntimeIngredient(id);
        if (altResult.isSuccess() && altResult.value.isChocolate()) {
          alternates.push(altResult.value);
        }
      }
    }

    return {
      chocolate,
      alternates,
      entity: spec
    };
  }

  /**
   * Resolves coating specifications to runtime ingredient objects.
   * @param coatings - The raw coatings specification
   * @returns Resolved coatings specification
   */
  public resolveCoatings(coatings: Confections.ICoatingsEntity): IResolvedCoatings {
    // Resolve all coating ingredient options
    const resolvedOptions: IResolvedCoatingOption[] = [];
    for (const id of coatings.ids) {
      const ingredientResult = this.getRuntimeIngredient(id);
      if (ingredientResult.isSuccess()) {
        resolvedOptions.push({
          id,
          ingredient: ingredientResult.value
        });
      }
      // Skip ingredients that fail to resolve
    }

    // Find the preferred option (by preferredId, or first option if not specified)
    const preferredId = coatings.preferredId ?? coatings.ids[0];
    const preferred = resolvedOptions.find((opt) => opt.id === preferredId);

    return {
      options: resolvedOptions,
      preferred,
      entity: coatings
    };
  }

  /**
   * Resolves mold references to runtime mold objects.
   * @param molds - The raw mold references with preferred selection
   * @returns Resolved mold references
   */
  public resolveMoldRefs(
    molds: Model.IOptionsWithPreferred<Confections.IConfectionMoldRef, MoldId>
  ): Model.IOptionsWithPreferred<IResolvedConfectionMoldRef, MoldId> {
    const resolvedOptions: IResolvedConfectionMoldRef[] = [];
    for (const ref of molds.options) {
      const moldResult = this.getRuntimeMold(ref.id);
      if (moldResult.isSuccess()) {
        resolvedOptions.push({
          id: ref.id,
          mold: moldResult.value,
          notes: ref.notes,
          entity: ref
        });
      }
      // Skip molds that fail to resolve
    }

    return {
      options: resolvedOptions,
      preferredId: molds.preferredId
    };
  }

  /**
   * Resolves additional chocolates to runtime objects.
   * @param additional - The raw additional chocolates
   * @param confectionId - The confection ID (for error messages)
   * @returns Resolved additional chocolates, or undefined if none
   */
  public resolveAdditionalChocolates(
    additional: ReadonlyArray<Confections.IAdditionalChocolateEntity> | undefined,
    confectionId: ConfectionId
  ): ReadonlyArray<IResolvedAdditionalChocolate> | undefined {
    if (!additional || additional.length === 0) {
      return undefined;
    }

    return additional.map((item) => ({
      chocolate: this.resolveChocolateSpec(item.chocolate, confectionId),
      purpose: item.purpose,
      entity: item
    }));
  }

  /**
   * Resolves filling slots to runtime objects.
   * @param slots - The raw filling slots
   * @returns Resolved filling slots, or undefined if none
   */
  public resolveFillingSlots(
    slots: ReadonlyArray<Confections.IFillingSlotEntity> | undefined
  ): ReadonlyArray<IResolvedFillingSlot> | undefined {
    if (!slots || slots.length === 0) {
      return undefined;
    }

    return slots.map((slot) => ({
      slotId: slot.slotId,
      name: slot.name,
      filling: this._resolveFillingOptions(slot.filling)
    }));
  }

  /**
   * Resolves procedure references to runtime objects.
   * @param procedures - The raw procedure references
   * @returns Resolved procedures, or undefined if none
   */
  public resolveProcedures(
    procedures: Model.IOptionsWithPreferred<Fillings.IProcedureRefEntity, ProcedureId> | undefined
  ): Model.IOptionsWithPreferred<IResolvedConfectionProcedure, ProcedureId> | undefined {
    if (!procedures || procedures.options.length === 0) {
      return undefined;
    }

    const resolvedOptions: IResolvedConfectionProcedure[] = [];
    for (const ref of procedures.options) {
      const procedureResult = this.getRuntimeProcedure(ref.id);
      if (procedureResult.isSuccess()) {
        resolvedOptions.push({
          id: ref.id,
          procedure: procedureResult.value,
          notes: ref.notes,
          entity: ref
        });
      }
      // Skip procedures that fail to resolve
    }

    /* c8 ignore next 4 - defensive: return undefined if all procedures failed to resolve */
    if (resolvedOptions.length === 0) {
      return undefined;
    }

    return {
      options: resolvedOptions,
      preferredId: procedures.preferredId
    };
  }

  /**
   * Resolves filling options for a filling slot.
   * @param options - The raw filling options to resolve
   * @returns Resolved filling options
   * @internal
   */
  private _resolveFillingOptions(
    options: Model.IOptionsWithPreferred<Confections.AnyFillingOptionEntity, Confections.FillingOptionId>
  ): Model.IOptionsWithPreferred<IResolvedFillingOption, Confections.FillingOptionId> {
    const resolvedOptions = options.options
      .map((opt) => this._resolveFillingOption(opt))
      .filter((r): r is IResolvedFillingOption => r !== undefined);

    return {
      options: resolvedOptions,
      preferredId: options.preferredId
    };
  }

  /**
   * Resolves a single filling option to either a recipe or ingredient.
   * @param option - The raw filling option
   * @returns Resolved filling option, or undefined if resolution fails
   * @internal
   */
  private _resolveFillingOption(
    option: Confections.AnyFillingOptionEntity
  ): IResolvedFillingOption | undefined {
    if (option.type === 'recipe') {
      const filling = this.getRuntimeFilling(option.id);
      /* c8 ignore next - defensive: skip fillings that fail to resolve */
      if (filling.isFailure()) return undefined;
      return {
        type: 'recipe',
        id: option.id,
        filling: filling.value,
        notes: option.notes,
        entity: option
      };
    } else {
      const ingredient = this.getRuntimeIngredient(option.id);
      /* c8 ignore next - defensive: skip ingredients that fail to resolve */
      if (ingredient.isFailure()) return undefined;
      return {
        type: 'ingredient',
        id: option.id,
        ingredient: ingredient.value,
        notes: option.notes,
        entity: option
      };
    }
  }

  // ============================================================================
  // Ingredients and Recipes (IReadOnlyValidatingResultMap)
  // ============================================================================

  /**
   * A searchable library of all ingredients, keyed by composite ID.
   * Ingredients are resolved lazily on access and cached.
   */
  public get ingredients(): MaterializedLibrary<
    IngredientId,
    IngredientEntity,
    AnyIngredient,
    IIngredientQuerySpec
  > {
    return this._getIngredients();
  }

  /**
   * A searchable library of all fillings, keyed by composite ID.
   * Fillings are resolved lazily on access and cached.
   */
  public get fillings(): MaterializedLibrary<
    FillingId,
    Fillings.IFillingRecipeEntity,
    FillingRecipe,
    IFillingRecipeQuerySpec
  > {
    return this._getFillingRecipes();
  }

  /**
   * Gets or creates the materialized ingredients library.
   * @internal
   */
  private _getIngredients(): MaterializedLibrary<
    IngredientId,
    IngredientEntity,
    AnyIngredient,
    IIngredientQuerySpec
  > {
    if (!this._ingredients) {
      this._ingredients = new MaterializedLibrary({
        inner: this._library.ingredients,
        converter: (entity, id) => Ingredient.create(this, id, entity),
        orchestrator: this._ingredientOrchestrator,
        logger: this.logger
      });
    }
    return this._ingredients!;
  }

  /**
   * Gets or creates the materialized filling recipes library.
   * @internal
   */
  private _getFillingRecipes(): MaterializedLibrary<
    FillingId,
    Fillings.IFillingRecipeEntity,
    FillingRecipe,
    IFillingRecipeQuerySpec
  > {
    if (!this._recipes) {
      this._recipes = new MaterializedLibrary({
        inner: this._library.fillings,
        converter: (entity, id) => FillingRecipe.create(this, id, entity),
        orchestrator: this._recipeOrchestrator,
        logger: this.logger
      });
    }
    return this._recipes!;
  }

  /**
   * Gets a resolved runtime ingredient by ID.
   * @internal - for use by orchestrators and internal navigation
   */
  public _getIngredient(id: IngredientId): Result<AnyIngredient> {
    return this._getIngredients().get(id).asResult;
  }

  /**
   * Gets a resolved runtime recipe by ID.
   * @internal - for use by orchestrators and internal navigation
   */
  public _getFillingRecipe(id: FillingId): Result<FillingRecipe> {
    return this._getFillingRecipes().get(id).asResult;
  }

  // ============================================================================
  // Procedure Lookups (for FillingRecipe procedure resolution)
  // ============================================================================

  /**
   * Gets a procedure by its composite ID.
   * Used internally by RuntimeFillingRecipe for procedure resolution.
   * @param id - The procedure ID (composite format: collectionId.baseProcedureId)
   * @returns Success with IProcedure, or Failure if not found
   */
  public getProcedure(id: string): Result<IProcedureEntity> {
    return this._library.getProcedure(id as ProcedureId);
  }

  // ============================================================================
  // IConfectionContext Implementation
  // ============================================================================

  /**
   * Gets a runtime ingredient by ID.
   * Implements IConfectionContext interface.
   * @param id - The ingredient ID (composite format: collectionId.baseIngredientId)
   * @returns Success with {@link LibraryRuntime.IIngredient | IIngredient},
   * or Failure if not found.
   */
  public getRuntimeIngredient(id: IngredientId): Result<IIngredient> {
    return this._getIngredient(id);
  }

  /**
   * Gets a runtime filling recipe by ID.
   * Implements IConfectionContext interface.
   * @param id - The filling ID (composite format: collectionId.baseFillingId)
   * @returns Success with IRuntimeFillingRecipe, or Failure if not found
   */
  public getRuntimeFilling(id: FillingId): Result<IFillingRecipe> {
    return this._getFillingRecipe(id);
  }

  // ============================================================================
  // Runtime Task/Procedure/Mold Accessors (ITaskContext, IProcedureContext)
  // ============================================================================

  /**
   * Gets a task by its composite ID.
   * Used internally for task resolution.
   * @param id - The task ID (composite format: collectionId.baseTaskId)
   * @returns Success with ITaskData, or Failure if not found
   */
  public getTaskEntity(id: TaskId): Result<IRawTaskEntity> {
    return this._library.getTask(id);
  }

  /**
   * Gets a runtime task by its composite ID (with caching).
   * Implements ITaskContext interface.
   * @param id - The task ID (composite format: collectionId.baseTaskId)
   * @returns Success with RuntimeTask, or Failure if not found
   */
  public getTask(id: TaskId): Result<Task> {
    return this._getTasks().get(id).asResult;
  }

  /**
   * Gets or creates the materialized tasks library.
   * @internal
   */
  private _getTasks(): MaterializedLibrary<TaskId, IRawTaskEntity, Task, never> {
    if (!this._tasks) {
      this._tasks = new MaterializedLibrary({
        inner: this._library.tasks,
        converter: (entity, id) => Task.create(this, id, entity),
        logger: this.logger
      });
    }
    return this._tasks;
  }

  /**
   * Gets a runtime procedure by its composite ID (with caching).
   * @param id - The procedure ID (composite format: collectionId.baseProcedureId)
   * @returns Success with RuntimeProcedure, or Failure if not found
   */
  public getRuntimeProcedure(id: ProcedureId): Result<Procedure> {
    return this._getProcedures().get(id).asResult;
  }

  /**
   * Gets or creates the materialized procedures library.
   * @internal
   */
  private _getProcedures(): MaterializedLibrary<ProcedureId, IProcedureEntity, Procedure, never> {
    if (!this._procedures) {
      this._procedures = new MaterializedLibrary({
        inner: this._library.procedures,
        converter: (entity, id) => Procedure.create(this, id, entity),
        logger: this.logger
      });
    }
    return this._procedures;
  }

  /**
   * Gets a runtime mold by its composite ID (with caching).
   * @param id - The mold ID (composite format: collectionId.baseMoldId)
   * @returns Success with RuntimeMold, or Failure if not found
   */
  public getRuntimeMold(id: MoldId): Result<Mold> {
    return this._getMolds().get(id).asResult;
  }

  /**
   * Gets or creates the materialized molds library.
   * @internal
   */
  private _getMolds(): MaterializedLibrary<MoldId, IMoldEntity, Mold, never> {
    if (!this._molds) {
      this._molds = new MaterializedLibrary({
        inner: this._library.molds,
        converter: (entity, id) => Mold.create(this, id, entity),
        logger: this.logger
      });
    }
    return this._molds;
  }

  // ============================================================================
  // Reverse Lookups (for RuntimeIngredient navigation)
  // ============================================================================

  // ---- Internal methods for ingredient navigation (IIngredientContext) ----

  /**
   * Gets all fillings that use a specific ingredient (primary or alternate).
   * Used internally by RuntimeIngredient for navigation.
   * @internal
   */
  public getFillingsUsingIngredient(ingredientId: IngredientId): FillingRecipe[] {
    const fillingIds = this._reverseIndex.getFillingsUsingIngredient(ingredientId);
    return this._resolveFillingIds(fillingIds);
  }

  /**
   * Gets fillings where ingredient is primary.
   * Used internally by RuntimeIngredient for navigation.
   * @internal
   */
  public getFillingsWithPrimaryIngredient(ingredientId: IngredientId): FillingRecipe[] {
    const fillingIds = this._reverseIndex.getFillingsWithPrimaryIngredient(ingredientId);
    return this._resolveFillingIds(fillingIds);
  }

  /**
   * Gets fillings where ingredient is an alternate.
   * Used internally by RuntimeIngredient for navigation.
   * @internal
   */
  public getFillingsWithAlternateIngredient(ingredientId: IngredientId): FillingRecipe[] {
    const fillingIds = this._reverseIndex.getFillingsWithAlternateIngredient(ingredientId);
    return this._resolveFillingIds(fillingIds);
  }

  /**
   * Resolves a set of filling IDs to RuntimeFillingRecipe objects.
   * @internal
   */
  private _resolveFillingIds(fillingIds: ReadonlySet<FillingId>): FillingRecipe[] {
    const result: FillingRecipe[] = [];
    for (const id of fillingIds) {
      const getResult = this._getFillingRecipes().get(id);
      if (getResult.isSuccess()) {
        result.push(getResult.value);
      }
    }
    return result;
  }

  /**
   * Gets detailed usage information for an ingredient.
   * @param ingredientId - The ingredient ID to look up
   * @returns Success with array of usage info, or Failure if ingredient doesn't exist
   */
  public getIngredientUsage(ingredientId: IngredientId): Result<ReadonlyArray<IIngredientUsageInfo>> {
    if (!this.ingredients.has(ingredientId)) {
      return Failure.with(`${ingredientId}: ingredient not found`);
    }
    return Success.with(this._reverseIndex.getIngredientUsage(ingredientId));
  }

  // ============================================================================
  // Tag Discovery
  // ============================================================================

  /**
   * Gets all unique tags used across fillings.
   */
  public getAllFillingTags(): ReadonlyArray<string> {
    return this._reverseIndex.getAllFillingTags();
  }

  /**
   * Gets all unique tags used across ingredients.
   */
  public getAllIngredientTags(): ReadonlyArray<string> {
    return this._reverseIndex.getAllIngredientTags();
  }

  /**
   * Gets all unique tags used across confections.
   */
  public getAllConfectionTags(): ReadonlyArray<string> {
    const tagsSet = new Set<string>();
    for (const confection of this.runtimeConfections.values()) {
      const tags = confection.effectiveTags;
      for (const tag of tags) {
        tagsSet.add(tag);
      }
    }
    return Array.from(tagsSet).sort();
  }

  // ============================================================================
  // Cache Management
  // ============================================================================

  /**
   * Gets the number of cached ingredients.
   */
  public get cachedIngredientCount(): number {
    return this._ingredients?.size ?? 0;
  }

  /**
   * Gets the number of cached recipes.
   */
  public get cachedRecipeCount(): number {
    return this._recipes?.size ?? 0;
  }

  /**
   * Gets the number of cached confections.
   */
  public get cachedConfectionCount(): number {
    return this._confections?.size ?? 0;
  }

  /**
   * Clears all cached runtime objects.
   * Use if underlying library data has changed.
   */
  public clearCache(): void {
    this._ingredients = undefined;
    this._recipes = undefined;
    this._confections = undefined;
    this._tasks = undefined;
    this._procedures = undefined;
    this._molds = undefined;
    this._reverseIndex.invalidate();
    this._recipeOrchestrator.invalidate();
    this._ingredientOrchestrator.invalidate();
    this.logger.info('LibraryRuntimeContext cache cleared');
  }

  /**
   * Pre-warms the reverse indexes for efficient queries.
   */
  public warmUp(): void {
    this._reverseIndex.warmUp();
    this._recipeOrchestrator.warmUp();
    this._ingredientOrchestrator.warmUp();
    this.logger.info('LibraryRuntimeContext indexes warmed up');
  }

  /**
   * Invalidates all indexer caches.
   * Call this when underlying library data changes.
   */
  public invalidateIndexers(): void {
    this._recipeOrchestrator.invalidate();
    this._ingredientOrchestrator.invalidate();
  }

  /**
   * Creates a weight calculation context for unit-aware weight calculations.
   * The context resolves ingredient IDs to their density values.
   * @returns A weight calculation context bound to this runtime's library
   * @public
   */
  public createWeightContext(): IWeightCalculationContext {
    return {
      getIngredientDensity: (id: IngredientId): number => {
        const result = this._library.getIngredient(id);
        if (result.isSuccess()) {
          return result.value.density ?? 1.0;
        }
        // Default to 1.0 g/mL if ingredient not found
        return 1.0;
      }
    };
  }
}
