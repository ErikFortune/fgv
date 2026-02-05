[**@fgv/ts-chocolate**](../../../README.md)

***

[@fgv/ts-chocolate](../../../README.md) / LibraryRuntime

# LibraryRuntime

Library-runtime packlet - materialized projections of library entities

Provides resolved views of ingredients, fillings, confections, and other
library entities with automatic reference resolution, navigation helpers,
and rich query capabilities.

This packlet contains the core runtime wrappers and resolution infrastructure.
For session management, use the runtime packlet.

## Namespaces

- [Indexers](namespaces/Indexers/README.md)
- [Internal](namespaces/Internal/README.md)

## Classes

- [AlcoholIngredient](classes/AlcoholIngredient.md)
- [BarTruffle](classes/BarTruffle.md)
- [BarTruffleVersion](classes/BarTruffleVersion.md)
- [ChocolateIngredient](classes/ChocolateIngredient.md)
- [Confection](classes/Confection.md)
- [ConfectionBase](classes/ConfectionBase.md)
- [ConfectionVersionBase](classes/ConfectionVersionBase.md)
- [DairyIngredient](classes/DairyIngredient.md)
- [FatIngredient](classes/FatIngredient.md)
- [FillingRecipe](classes/FillingRecipe.md)
- [FillingRecipeQuery](classes/FillingRecipeQuery.md)
- [FillingRecipeVersion](classes/FillingRecipeVersion.md)
- [Ingredient](classes/Ingredient.md)
- [IngredientBase](classes/IngredientBase.md)
- [IngredientQuery](classes/IngredientQuery.md)
- [LibraryRuntimeContext](classes/LibraryRuntimeContext.md)
- [MaterializedLibrary](classes/MaterializedLibrary.md)
- [Mold](classes/Mold.md)
- [MoldedBonBon](classes/MoldedBonBon.md)
- [MoldedBonBonVersion](classes/MoldedBonBonVersion.md)
- [Procedure](classes/Procedure.md)
- [ProducedBarTruffle](classes/ProducedBarTruffle.md)
- [ProducedConfectionBase](classes/ProducedConfectionBase.md)
- [ProducedFilling](classes/ProducedFilling.md)
- [ProducedMoldedBonBon](classes/ProducedMoldedBonBon.md)
- [ProducedRolledTruffle](classes/ProducedRolledTruffle.md)
- [RolledTruffle](classes/RolledTruffle.md)
- [RolledTruffleVersion](classes/RolledTruffleVersion.md)
- [SugarIngredient](classes/SugarIngredient.md)
- [Task](classes/Task.md)
- [ValidatingLibrary](classes/ValidatingLibrary.md)

## Interfaces

- [IAlcoholIngredient](interfaces/IAlcoholIngredient.md)
- [IBarTruffle](interfaces/IBarTruffle.md)
- [IBarTruffleVersion](interfaces/IBarTruffleVersion.md)
- [ICategoryFilter](interfaces/ICategoryFilter.md)
- [IChocolateIngredient](interfaces/IChocolateIngredient.md)
- [IChocolateLibraryCreateParams](interfaces/IChocolateLibraryCreateParams.md)
- [IConfectionBase](interfaces/IConfectionBase.md)
- [IConfectionChanges](interfaces/IConfectionChanges.md)
- [IConfectionVersionBase](interfaces/IConfectionVersionBase.md)
- [IDairyIngredient](interfaces/IDairyIngredient.md)
- [IFatIngredient](interfaces/IFatIngredient.md)
- [IFillingChanges](interfaces/IFillingChanges.md)
- [IFillingRecipe](interfaces/IFillingRecipe.md)
- [IFillingRecipeVersion](interfaces/IFillingRecipeVersion.md)
- [IFindOrchestrator](interfaces/IFindOrchestrator.md)
- [IGanacheAnalysis](interfaces/IGanacheAnalysis.md)
- [IGanacheCalculation](interfaces/IGanacheCalculation.md)
- [IGanacheValidation](interfaces/IGanacheValidation.md)
- [IIngredient](interfaces/IIngredient.md)
- [IIngredientQueryOptions](interfaces/IIngredientQueryOptions.md)
- [IIngredientResolutionResult](interfaces/IIngredientResolutionResult.md)
- [IIngredientUsageInfo](interfaces/IIngredientUsageInfo.md)
- [IInstantiatedLibrarySource](interfaces/IInstantiatedLibrarySource.md)
- [IIterationOptions](interfaces/IIterationOptions.md)
- [ILibraryRuntimeContext](interfaces/ILibraryRuntimeContext.md)
- [ILibraryRuntimeContextCreateParams](interfaces/ILibraryRuntimeContextCreateParams.md)
- [IMaterializedLibraryParams](interfaces/IMaterializedLibraryParams.md)
- [IMold](interfaces/IMold.md)
- [IMoldedBonBon](interfaces/IMoldedBonBon.md)
- [IMoldedBonBonVersion](interfaces/IMoldedBonBonVersion.md)
- [INumericRange](interfaces/INumericRange.md)
- [IProcedure](interfaces/IProcedure.md)
- [IProcedureRenderContext](interfaces/IProcedureRenderContext.md)
- [IQueryResult](interfaces/IQueryResult.md)
- [IReadOnlyValidatingLibrary](interfaces/IReadOnlyValidatingLibrary.md)
- [IRenderedProcedure](interfaces/IRenderedProcedure.md)
- [IRenderedStep](interfaces/IRenderedStep.md)
- [IResolvedAdditionalChocolate](interfaces/IResolvedAdditionalChocolate.md)
- [IResolvedChocolateSpec](interfaces/IResolvedChocolateSpec.md)
- [IResolvedCoatingOption](interfaces/IResolvedCoatingOption.md)
- [IResolvedCoatings](interfaces/IResolvedCoatings.md)
- [IResolvedConfectionMoldRef](interfaces/IResolvedConfectionMoldRef.md)
- [IResolvedConfectionProcedure](interfaces/IResolvedConfectionProcedure.md)
- [IResolvedFillingIngredient](interfaces/IResolvedFillingIngredient.md)
- [IResolvedFillingRecipeProcedure](interfaces/IResolvedFillingRecipeProcedure.md)
- [IResolvedFillingSlot](interfaces/IResolvedFillingSlot.md)
- [IResolvedIngredient](interfaces/IResolvedIngredient.md)
- [IResolvedIngredientFillingOption](interfaces/IResolvedIngredientFillingOption.md)
- [IResolvedProcedures](interfaces/IResolvedProcedures.md)
- [IResolvedRecipeFillingOption](interfaces/IResolvedRecipeFillingOption.md)
- [IRolledTruffle](interfaces/IRolledTruffle.md)
- [IRolledTruffleVersion](interfaces/IRolledTruffleVersion.md)
- [ISugarIngredient](interfaces/ISugarIngredient.md)
- [ITask](interfaces/ITask.md)
- [IValidatingLibraryParams](interfaces/IValidatingLibraryParams.md)

## Type Aliases

- [AnyConfection](type-aliases/AnyConfection.md)
- [AnyConfectionVersion](type-aliases/AnyConfectionVersion.md)
- [AnyIngredient](type-aliases/AnyIngredient.md)
- [ComparisonOperator](type-aliases/ComparisonOperator.md)
- [FillingRecipeFilter](type-aliases/FillingRecipeFilter.md)
- [FillingRecipeIngredientsFilter](type-aliases/FillingRecipeIngredientsFilter.md)
- [FilterPredicate](type-aliases/FilterPredicate.md)
- [IngredientFilter](type-aliases/IngredientFilter.md)
- [IngredientResolver](type-aliases/IngredientResolver.md)
- [IResolvedFillingOption](type-aliases/IResolvedFillingOption.md)
- [ResolutionStatus](type-aliases/ResolutionStatus.md)

## Functions

- [andFilters](functions/andFilters.md)
- [atLeast](functions/atLeast.md)
- [atMost](functions/atMost.md)
- [collectionContains](functions/collectionContains.md)
- [collectionContainsAny](functions/collectionContainsAny.md)
- [containsIgnoreCase](functions/containsIgnoreCase.md)
- [equals](functions/equals.md)
- [hasAllTags](functions/hasAllTags.md)
- [hasAnyTag](functions/hasAnyTag.md)
- [hasTag](functions/hasTag.md)
- [inRange](functions/inRange.md)
- [notFilter](functions/notFilter.md)
- [oneOf](functions/oneOf.md)
- [orFilters](functions/orFilters.md)

## References

### ChocolateLibrary

Re-exports [ChocolateLibrary](../../../classes/ChocolateLibrary.md)
