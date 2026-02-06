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
 * ChocolateLibrary - central hub access to materialized chocolate library objects.
 * @packageDocumentation
 */

import { Failure, Logging, Result, Success } from '@fgv/ts-utils';

import { ConfectionId, IngredientId, MoldId, ProcedureId, FillingId, TaskId } from '../common';
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
import { ChocolateEntityLibrary, IChocolateEntityLibraryCreateParams } from './chocolateEntityLibrary';
import {
  IConfectionContext,
  IIngredientContext,
  IIngredientUsageInfo,
  IChocolateLibrary,
  IVariationContext
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
import { Task } from './tasks';
import { Procedure } from './procedures';
import { Mold } from './molds';

/**
 * Parameters for creating a ChocolateLibrary with a new library
 * @public
 */
export interface IChocolateLibraryCreateParams {
  /**
   * Parameters for creating the underlying ChocolateEntityLibrary
   */
  readonly entityLibraryParams?: IChocolateEntityLibraryCreateParams;

  /**
   * Whether to pre-warm the reverse index on context creation.
   * @defaultValue false
   */
  readonly preWarm?: boolean;
}

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
export class ChocolateLibrary
  implements IVariationContext<AnyIngredient>, IIngredientContext, IConfectionContext, IChocolateLibrary
{
  private readonly _entities: ChocolateEntityLibrary;
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
    | MaterializedLibrary<ConfectionId, Confections.AnyConfectionRecipeEntity, AnyConfection, never>
    | undefined;

  // Extensible indexer orchestrators
  private readonly _recipeOrchestrator: FillingRecipeIndexerOrchestrator;
  private readonly _ingredientOrchestrator: IngredientIndexerOrchestrator;

  protected constructor(library: ChocolateEntityLibrary, preWarm: boolean) {
    this._entities = library;
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
   * Creates a ChocolateLibrary with a new or default ChocolateEntityLibrary.
   * This is the primary factory method for most use cases.
   * @param params - Optional parameters for library and caching
   * @returns Success with ChocolateLibrary, or Failure if library creation fails
   */
  public static create(params?: IChocolateLibraryCreateParams): Result<ChocolateLibrary> {
    return ChocolateEntityLibrary.create(params?.entityLibraryParams).onSuccess((library) => {
      return Success.with(new ChocolateLibrary(library, params?.preWarm ?? false));
    });
  }

  /**
   * Creates a ChocolateLibrary wrapping an existing ChocolateEntityLibrary.
   * Use this when you already have a configured library instance.
   * @param library - The ChocolateEntityLibrary to wrap
   * @param preWarm - Whether to pre-warm the reverse index
   * @returns Success with ChocolateLibrary
   */
  public static fromChocolateEntityLibrary(
    library: ChocolateEntityLibrary,
    preWarm?: boolean
  ): Result<ChocolateLibrary> {
    return Success.with(new ChocolateLibrary(library, preWarm ?? false));
  }

  // ============================================================================
  // Library Access
  // ============================================================================

  /**
   * {@inheritDoc LibraryRuntime.IChocolateLibrary.entities}
   */
  public get entities(): ChocolateEntityLibrary {
    return this._entities;
  }

  // ============================================================================
  // Confections
  // ============================================================================

  /**
   * A materialized library of all confections, keyed by composite ID.
   * Confections are resolved lazily on access and cached.
   */
  public get confections(): MaterializedLibrary<
    ConfectionId,
    Confections.AnyConfectionRecipeEntity,
    AnyConfection,
    never
  > {
    return this._getConfections();
  }

  /**
   * A materialized library of all molds, keyed by composite ID.
   * Molds are resolved lazily on access and cached.
   */
  public get molds(): MaterializedLibrary<MoldId, IMoldEntity, Mold, never> {
    return this._getMolds();
  }

  /**
   * A materialized library of all procedures, keyed by composite ID.
   * Procedures are resolved lazily on access and cached.
   */
  public get procedures(): MaterializedLibrary<ProcedureId, IProcedureEntity, Procedure, never> {
    return this._getProcedures();
  }

  /**
   * A materialized library of all tasks, keyed by composite ID.
   * Tasks are resolved lazily on access and cached.
   */
  public get tasks(): MaterializedLibrary<TaskId, IRawTaskEntity, Task, never> {
    return this._getTasks();
  }

  /**
   * Gets or creates the materialized confections library.
   * @internal
   */
  private _getConfections(): MaterializedLibrary<
    ConfectionId,
    Confections.AnyConfectionRecipeEntity,
    AnyConfection,
    never
  > {
    if (!this._confections) {
      this._confections = new MaterializedLibrary({
        inner: this._entities.confections,
        converter: (entity, id) => Confection.create(this, id, entity),
        logger: this.logger
      });
    }
    return this._confections;
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
        inner: this._entities.ingredients,
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
        inner: this._entities.fillings,
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

  /**
   * Gets or creates the materialized tasks library.
   * @internal
   */
  private _getTasks(): MaterializedLibrary<TaskId, IRawTaskEntity, Task, never> {
    if (!this._tasks) {
      this._tasks = new MaterializedLibrary({
        inner: this._entities.tasks,
        converter: (entity, id) => Task.create(this, id, entity),
        logger: this.logger
      });
    }
    return this._tasks;
  }

  /**
   * Gets or creates the materialized procedures library.
   * @internal
   */
  private _getProcedures(): MaterializedLibrary<ProcedureId, IProcedureEntity, Procedure, never> {
    if (!this._procedures) {
      this._procedures = new MaterializedLibrary({
        inner: this._entities.procedures,
        converter: (entity, id) => Procedure.create(this, id, entity),
        logger: this.logger
      });
    }
    return this._procedures;
  }

  /**
   * Gets or creates the materialized molds library.
   * @internal
   */
  private _getMolds(): MaterializedLibrary<MoldId, IMoldEntity, Mold, never> {
    if (!this._molds) {
      this._molds = new MaterializedLibrary({
        inner: this._entities.molds,
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
    for (const confection of this.confections.values()) {
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
    this.logger.info('ChocolateLibrary cache cleared');
  }

  /**
   * Pre-warms the reverse indexes for efficient queries.
   */
  public warmUp(): void {
    this._reverseIndex.warmUp();
    this._recipeOrchestrator.warmUp();
    this._ingredientOrchestrator.warmUp();
    this.logger.info('ChocolateLibrary indexes warmed up');
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
        const result = this._entities.ingredients.get(id);
        if (result.isSuccess()) {
          return result.value.density ?? 1.0;
        }
        // Default to 1.0 g/mL if ingredient not found
        return 1.0;
      }
    };
  }
}
