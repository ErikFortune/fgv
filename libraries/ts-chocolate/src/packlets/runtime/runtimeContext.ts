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
 * RuntimeContext - central hub for the runtime object access layer
 * @packageDocumentation
 */

import { Collections, fail, Failure, Logging, Result, succeed, Success } from '@fgv/ts-utils';

import {
  ConfectionId,
  Helpers,
  IngredientId,
  ProcedureId,
  FillingId,
  FillingVersionId,
  Validation
} from '../common';
import { ConfectionData, ConfectionsLibrary } from '../confections';
import { IComputedScaledFillingRecipe, IWeightCalculationContext } from '../fillings';
import { IFillingRecipeJournalRecord, JournalLibrary } from '../journal';
import { Procedure } from '../procedures';
import { ChocolateLibrary, IChocolateLibraryCreateParams } from './chocolateLibrary';
import {
  IIngredientContext,
  IIngredientUsageInfo,
  IRuntimeIngredient,
  IRuntimeFillingRecipe,
  IRuntimeFillingRecipeVersion,
  IScaledVersionContext,
  IVersionContext
} from './model';
import { RuntimeReverseIndex } from './runtimeReverseIndex';
import { RuntimeIngredient, AnyRuntimeIngredient } from './ingredients';
import { RuntimeRecipe } from './runtimeRecipe';
import {
  IIngredientQuerySpec,
  IFillingRecipeQuerySpec,
  IngredientIndexerOrchestrator,
  RecipeIndexerOrchestrator
} from './indexers';
import { IReadOnlyValidatingLibrary, ValidatingLibrary } from './validatingLibrary';

// ============================================================================
// RuntimeContext Parameters
// ============================================================================

/**
 * Parameters for creating a RuntimeContext with a new library
 * @public
 */
export interface IRuntimeContextCreateParams {
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
// RuntimeContext Class
// ============================================================================

/**
 * Central context for the runtime object access layer.
 * Provides factory methods for runtime objects, caching, and reverse lookups.
 *
 * This is the primary entry point for consumers who want resolved views
 * of recipes and ingredients with automatic reference resolution.
 *
 * @public
 */
export class RuntimeContext
  implements
    IVersionContext<AnyRuntimeIngredient>,
    IScaledVersionContext<AnyRuntimeIngredient>,
    IIngredientContext
{
  private readonly _library: ChocolateLibrary;
  private readonly _reverseIndex: RuntimeReverseIndex;

  /**
   * Logger used by this runtime context and its libraries.
   */
  public readonly logger: Logging.LogReporter<unknown>;

  // Lazily-populated libraries with integrated find support
  // The fourth type parameter is the orchestrator's entity type (interface type)
  private _ingredients:
    | ValidatingLibrary<IngredientId, AnyRuntimeIngredient, IIngredientQuerySpec, IRuntimeIngredient>
    | undefined;
  private _recipes:
    | ValidatingLibrary<FillingId, RuntimeRecipe, IFillingRecipeQuerySpec, IRuntimeFillingRecipe>
    | undefined;

  // Extensible indexer orchestrators
  private readonly _recipeOrchestrator: RecipeIndexerOrchestrator;
  private readonly _ingredientOrchestrator: IngredientIndexerOrchestrator;

  private constructor(library: ChocolateLibrary, preWarm: boolean) {
    this._library = library;
    this.logger = library.logger;

    this._reverseIndex = new RuntimeReverseIndex(library);

    // Initialize orchestrators with resolver functions bound to this context
    // Orchestrators get logger from library automatically
    this._recipeOrchestrator = new RecipeIndexerOrchestrator(library, (id) => this._getRecipe(id));
    this._ingredientOrchestrator = new IngredientIndexerOrchestrator(library, (id) =>
      this._getIngredient(id)
    );

    if (preWarm) {
      this._reverseIndex.warmUp();
      this._recipeOrchestrator.warmUp();
      this._ingredientOrchestrator.warmUp();
    }
  }

  /**
   * Creates a RuntimeContext with a new or default ChocolateLibrary.
   * This is the primary factory method for most use cases.
   * @param params - Optional parameters for library and caching
   * @returns Success with RuntimeContext, or Failure if library creation fails
   */
  public static create(params?: IRuntimeContextCreateParams): Result<RuntimeContext> {
    return ChocolateLibrary.create(params?.libraryParams).onSuccess((library) => {
      return Success.with(new RuntimeContext(library, params?.preWarm ?? false));
    });
  }

  /**
   * Creates a RuntimeContext wrapping an existing ChocolateLibrary.
   * Use this when you already have a configured library instance.
   * @param library - The ChocolateLibrary to wrap
   * @param preWarm - Whether to pre-warm the reverse index
   * @returns Success with RuntimeContext
   */
  public static fromLibrary(library: ChocolateLibrary, preWarm?: boolean): Result<RuntimeContext> {
    return Success.with(new RuntimeContext(library, preWarm ?? false));
  }

  // ============================================================================
  // Library Access
  // ============================================================================

  /**
   * {@inheritdoc Runtime.RuntimeContext.library}
   */
  public get library(): ChocolateLibrary {
    return this._library;
  }

  // ============================================================================
  // Journals
  // ============================================================================

  /**
   * The journals library for managing cooking session records.
   */
  public get journals(): JournalLibrary {
    return this._library.journals;
  }

  /**
   * Gets all journal records for a filling (across all versions).
   * @param fillingId - The filling ID to search for
   * @returns Array of journal records (empty if none found)
   */
  public getJournalsForFilling(fillingId: FillingId): ReadonlyArray<IFillingRecipeJournalRecord> {
    return this._library.getJournalsForFilling(fillingId);
  }

  /**
   * Gets all journal records for a specific filling version.
   * @param versionId - The filling version ID to search for
   * @returns Array of journal records (empty if none found)
   */
  public getJournalsForFillingVersion(
    versionId: FillingVersionId
  ): ReadonlyArray<IFillingRecipeJournalRecord> {
    return this._library.getJournalsForFillingVersion(versionId);
  }

  // ============================================================================
  // Confections
  // ============================================================================

  /**
   * The confections library for accessing confection data.
   */
  public get confections(): ConfectionsLibrary {
    return this._library.confections;
  }

  /**
   * Gets a confection by ID.
   * @param id - The confection ID
   * @returns Success with confection data, or Failure if not found
   */
  public getConfection(id: ConfectionId): Result<ConfectionData> {
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

  // ============================================================================
  // Ingredients and Recipes (IReadOnlyValidatingResultMap)
  // ============================================================================

  /**
   * A searchable library of all ingredients, keyed by composite ID.
   * Ingredients are resolved eagerly on first access and cached.
   */
  public get ingredients(): IReadOnlyValidatingLibrary<
    IngredientId,
    AnyRuntimeIngredient,
    IIngredientQuerySpec
  > {
    return this._resolveIngredients();
  }

  /**
   * A searchable library of all fillings, keyed by composite ID.
   * Fillings are resolved eagerly on first access and cached.
   */
  public get fillings(): IReadOnlyValidatingLibrary<FillingId, RuntimeRecipe, IFillingRecipeQuerySpec> {
    return this._resolveRecipes();
  }

  /**
   * Resolves and caches all ingredients from the library.
   * @internal
   */
  private _resolveIngredients(): ValidatingLibrary<
    IngredientId,
    AnyRuntimeIngredient,
    IIngredientQuerySpec,
    IRuntimeIngredient
  > {
    if (this._ingredients === undefined) {
      this._ingredients = new ValidatingLibrary({
        converters: new Collections.KeyValueConverters<IngredientId, AnyRuntimeIngredient>({
          key: Validation.toIngredientId,
          /* c8 ignore next 4 - defensive code: value converter only used for external validation, not internal population */
          value: (from: unknown) =>
            from instanceof RuntimeIngredient
              ? succeed(from as AnyRuntimeIngredient)
              : fail('not a runtime ingredient')
        }),
        orchestrator: this._ingredientOrchestrator
      });
      // Populate from library - report unexpected creation errors
      for (const [id, ingredient] of this._library.ingredients.entries()) {
        RuntimeIngredient.create(this, id, ingredient)
          .onSuccess((ri) => this._ingredients!.set(id, ri))
          .report(this.logger);
      }
    }
    return this._ingredients;
  }

  /**
   * Resolves and caches all recipes from the library.
   * @internal
   */
  private _resolveRecipes(): ValidatingLibrary<
    FillingId,
    RuntimeRecipe,
    IFillingRecipeQuerySpec,
    IRuntimeFillingRecipe
  > {
    if (this._recipes === undefined) {
      this._recipes = new ValidatingLibrary({
        converters: new Collections.KeyValueConverters<FillingId, RuntimeRecipe>({
          key: Validation.toFillingId,
          /* c8 ignore next 2 - defensive code: value converter only used for external validation, not internal population */
          value: (from: unknown) =>
            from instanceof RuntimeRecipe ? succeed(from) : fail('not a runtime recipe')
        }),
        orchestrator: this._recipeOrchestrator
      });
      // Populate from library
      for (const [id, recipe] of this._library.fillings.entries()) {
        this._recipes.set(id, new RuntimeRecipe(this, id, recipe));
      }
    }
    return this._recipes;
  }

  /**
   * Gets a resolved runtime ingredient by ID.
   * @internal - for use by orchestrators and internal navigation
   */
  public _getIngredient(id: IngredientId): Result<AnyRuntimeIngredient> {
    return this._resolveIngredients().get(id).asResult;
  }

  /**
   * Gets a resolved runtime recipe by ID.
   * @internal - for use by orchestrators and internal navigation
   */
  public _getRecipe(id: FillingId): Result<RuntimeRecipe> {
    return this._resolveRecipes().get(id).asResult;
  }

  /**
   * Gets the source version for a computed scaled recipe.
   * Used internally by RuntimeScaledVersion to resolve the source reference.
   * @param scaled - The computed scaled recipe containing source IDs
   * @returns Success with the resolved source version, or Failure if not found
   * @internal
   */
  public getSourceVersion(scaled: IComputedScaledFillingRecipe): Result<IRuntimeFillingRecipeVersion> {
    // Parse the composite FillingVersionId to get fillingId and versionSpec
    return Helpers.parseFillingVersionId(scaled.scaledFrom.sourceVersionId).onSuccess((parsed) => {
      const fillingId = parsed.collectionId;
      const versionSpec = parsed.itemId;
      return this._getRecipe(fillingId).onSuccess((recipe) => recipe.getVersion(versionSpec));
    });
  }

  // ============================================================================
  // Procedure Lookups (for RuntimeRecipe procedure resolution)
  // ============================================================================

  /**
   * Gets a procedure by its composite ID.
   * Used internally by RuntimeRecipe for procedure resolution.
   * @param id - The procedure ID (composite format: sourceId.baseProcedureId)
   * @returns Success with Procedure, or Failure if not found
   */
  public getProcedure(id: string): Result<Procedure> {
    return this._library.getProcedure(id as ProcedureId);
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
  public getFillingsUsingIngredient(ingredientId: IngredientId): RuntimeRecipe[] {
    const fillingIds = this._reverseIndex.getFillingsUsingIngredient(ingredientId);
    return this._resolveFillingIds(fillingIds);
  }

  /**
   * Gets fillings where ingredient is primary.
   * Used internally by RuntimeIngredient for navigation.
   * @internal
   */
  public getFillingsWithPrimaryIngredient(ingredientId: IngredientId): RuntimeRecipe[] {
    const fillingIds = this._reverseIndex.getFillingsWithPrimaryIngredient(ingredientId);
    return this._resolveFillingIds(fillingIds);
  }

  /**
   * Gets fillings where ingredient is an alternate.
   * Used internally by RuntimeIngredient for navigation.
   * @internal
   */
  public getFillingsWithAlternateIngredient(ingredientId: IngredientId): RuntimeRecipe[] {
    const fillingIds = this._reverseIndex.getFillingsWithAlternateIngredient(ingredientId);
    return this._resolveFillingIds(fillingIds);
  }

  /**
   * Resolves a set of filling IDs to RuntimeRecipe objects.
   * @internal
   */
  private _resolveFillingIds(fillingIds: ReadonlySet<FillingId>): RuntimeRecipe[] {
    const result: RuntimeRecipe[] = [];
    for (const id of fillingIds) {
      this._getRecipe(id).onSuccess((r: RuntimeRecipe) => Success.with(result.push(r)));
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
   * Clears all cached runtime objects.
   * Use if underlying library data has changed.
   */
  public clearCache(): void {
    this._ingredients = undefined;
    this._recipes = undefined;
    this._reverseIndex.invalidate();
    this._recipeOrchestrator.invalidate();
    this._ingredientOrchestrator.invalidate();
    this.logger.info('RuntimeContext cache cleared');
  }

  /**
   * Pre-warms the reverse indexes for efficient queries.
   */
  public warmUp(): void {
    this._reverseIndex.warmUp();
    this._recipeOrchestrator.warmUp();
    this._ingredientOrchestrator.warmUp();
    this.logger.info('RuntimeContext indexes warmed up');
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
