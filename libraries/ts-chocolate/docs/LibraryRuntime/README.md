[Home](../README.md) > LibraryRuntime

# Namespace: LibraryRuntime

Library-runtime packlet - materialized projections of library entities

Provides resolved views of ingredients, fillings, confections, and other
library entities with automatic reference resolution, navigation helpers,
and rich query capabilities.

This packlet contains the core runtime wrappers and resolution infrastructure.
For session management, use the runtime packlet.

## Namespaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[Indexers](./Indexers/README.md)

</td><td>

Extensible indexer infrastructure for efficient reverse lookups

</td></tr>
<tr><td>

[Internal](./Internal/README.md)

</td><td>

Internal calculation utilities for library-runtime

</td></tr>
</tbody></table>

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IngredientQuery](./classes/IngredientQuery.md)

</td><td>

Fluent query builder for ingredients.

</td></tr>
<tr><td>

[FillingRecipeQuery](./classes/FillingRecipeQuery.md)

</td><td>

Fluent query builder for recipes.

</td></tr>
<tr><td>

[ProducedFilling](./classes/ProducedFilling.md)

</td><td>

Mutable wrapper for IProducedFilling with undo/redo support.

</td></tr>
<tr><td>

[ProducedConfectionBase](./classes/ProducedConfectionBase.md)

</td><td>

Mutable wrapper base class for IProducedConfection with undo/redo support.

</td></tr>
<tr><td>

[ProducedMoldedBonBon](./classes/ProducedMoldedBonBon.md)

</td><td>

Mutable wrapper for IProducedMoldedBonBon with undo/redo support.

</td></tr>
<tr><td>

[ProducedBarTruffle](./classes/ProducedBarTruffle.md)

</td><td>

Mutable wrapper for IProducedBarTruffle with undo/redo support.

</td></tr>
<tr><td>

[ProducedRolledTruffle](./classes/ProducedRolledTruffle.md)

</td><td>

Mutable wrapper for IProducedRolledTruffle with undo/redo support.

</td></tr>
<tr><td>

[LibraryRuntimeContext](./classes/LibraryRuntimeContext.md)

</td><td>

Central context for the library-runtime object access layer.

</td></tr>
<tr><td>

[ValidatingLibrary](./classes/ValidatingLibrary.md)

</td><td>

A ValidatingResultMap with integrated find functionality.

</td></tr>
<tr><td>

[MaterializedLibrary](./classes/MaterializedLibrary.md)

</td><td>

A read-only library providing lazily-materialized, cached runtime objects.

</td></tr>
<tr><td>

[IngredientBase](./classes/IngredientBase.md)

</td><td>

Abstract base class for runtime ingredients.

</td></tr>
<tr><td>

[ChocolateIngredient](./classes/ChocolateIngredient.md)

</td><td>

A resolved view of a chocolate ingredient with navigation capabilities.

</td></tr>
<tr><td>

[DairyIngredient](./classes/DairyIngredient.md)

</td><td>

A resolved view of a dairy ingredient with navigation capabilities.

</td></tr>
<tr><td>

[SugarIngredient](./classes/SugarIngredient.md)

</td><td>

A resolved view of a sugar ingredient with navigation capabilities.

</td></tr>
<tr><td>

[FatIngredient](./classes/FatIngredient.md)

</td><td>

A resolved view of a fat ingredient with navigation capabilities.

</td></tr>
<tr><td>

[AlcoholIngredient](./classes/AlcoholIngredient.md)

</td><td>

A resolved view of an alcohol ingredient with navigation capabilities.

</td></tr>
<tr><td>

[Ingredient](./classes/Ingredient.md)

</td><td>

Static factory for creating runtime ingredients.

</td></tr>
<tr><td>

[FillingRecipe](./classes/FillingRecipe.md)

</td><td>

A resolved view of a recipe with navigation and variation access.

</td></tr>
<tr><td>

[FillingRecipeVariation](./classes/FillingRecipeVariation.md)

</td><td>

A resolved view of a recipe variation with all ingredients resolved.

</td></tr>
<tr><td>

[ConfectionBase](./classes/ConfectionBase.md)

</td><td>

Abstract base class for runtime confections.

</td></tr>
<tr><td>

[MoldedBonBonRecipe](./classes/MoldedBonBonRecipe.md)

</td><td>

A resolved view of a molded bonbon confection with navigation capabilities.

</td></tr>
<tr><td>

[BarTruffleRecipe](./classes/BarTruffleRecipe.md)

</td><td>

A resolved view of a bar truffle confection recipe with navigation capabilities.

</td></tr>
<tr><td>

[RolledTruffleRecipe](./classes/RolledTruffleRecipe.md)

</td><td>

A resolved view of a rolled truffle confection with navigation capabilities.

</td></tr>
<tr><td>

[Confection](./classes/Confection.md)

</td><td>

Static factory for creating runtime confections.

</td></tr>
<tr><td>

[ConfectionRecipeVariationBase](./classes/ConfectionRecipeVariationBase.md)

</td><td>

Abstract base class for runtime confection variations.

</td></tr>
<tr><td>

[MoldedBonBonRecipeVariation](./classes/MoldedBonBonRecipeVariation.md)

</td><td>

A resolved view of a molded bonbon variation with all references resolved.

</td></tr>
<tr><td>

[BarTruffleRecipeVariation](./classes/BarTruffleRecipeVariation.md)

</td><td>

A resolved view of a bar truffle recipe variation with all references resolved.

</td></tr>
<tr><td>

[RolledTruffleRecipeVariation](./classes/RolledTruffleRecipeVariation.md)

</td><td>

A view of a rolled truffle recipe variation with all references resolved.

</td></tr>
<tr><td>

[Task](./classes/Task.md)

</td><td>

A resolved view of a task with rendering capabilities.

</td></tr>
<tr><td>

[Procedure](./classes/Procedure.md)

</td><td>

A resolved view of a procedure with proper task resolution.

</td></tr>
<tr><td>

[Mold](./classes/Mold.md)

</td><td>

A resolved view of a mold with computed properties.

</td></tr>
</tbody></table>

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IInstantiatedEntityLibrarySources](./interfaces/IInstantiatedEntityLibrarySources.md)

</td><td>

Pre-built library instances to include in a LibraryRuntime.ChocolateEntityLibrary | ChocolateEntityLibrary.

</td></tr>
<tr><td>

[IChocolateEntityLibraryCreateParams](./interfaces/IChocolateEntityLibraryCreateParams.md)

</td><td>

Parameters for creating a LibraryRuntime.ChocolateEntityLibrary | ChocolateEntityLibrary.

</td></tr>
<tr><td>

[IIngredient](./interfaces/IIngredient.md)

</td><td>

Base interface for all runtime ingredients.

</td></tr>
<tr><td>

[IChocolateIngredient](./interfaces/IChocolateIngredient.md)

</td><td>

Runtime ingredient narrowed to chocolate type.

</td></tr>
<tr><td>

[IDairyIngredient](./interfaces/IDairyIngredient.md)

</td><td>

Runtime ingredient narrowed to dairy type.

</td></tr>
<tr><td>

[ISugarIngredient](./interfaces/ISugarIngredient.md)

</td><td>

Runtime ingredient narrowed to sugar type.

</td></tr>
<tr><td>

[IFatIngredient](./interfaces/IFatIngredient.md)

</td><td>

Runtime ingredient narrowed to fat type.

</td></tr>
<tr><td>

[IAlcoholIngredient](./interfaces/IAlcoholIngredient.md)

</td><td>

Runtime ingredient narrowed to alcohol type.

</td></tr>
<tr><td>

[ICategoryFilter](./interfaces/ICategoryFilter.md)

</td><td>

Filter by ingredient category.

</td></tr>
<tr><td>

[IFillingRecipeVariation](./interfaces/IFillingRecipeVariation.md)

</td><td>

A resolved runtime view of a recipe variation with resolved ingredients.

</td></tr>
<tr><td>

[IResolvedFillingRecipeProcedure](./interfaces/IResolvedFillingRecipeProcedure.md)

</td><td>

A resolved procedure reference with the full procedure object.

</td></tr>
<tr><td>

[IResolvedProcedures](./interfaces/IResolvedProcedures.md)

</td><td>

Collection of resolved procedures associated with a recipe.

</td></tr>
<tr><td>

[IFillingRecipe](./interfaces/IFillingRecipe.md)

</td><td>

A resolved runtime view of a recipe with navigation and variation access.

</td></tr>
<tr><td>

[IResolvedFillingIngredient](./interfaces/IResolvedFillingIngredient.md)

</td><td>

A resolved ingredient reference with full ingredient data and alternates.

</td></tr>
<tr><td>

[IIngredientResolutionResult](./interfaces/IIngredientResolutionResult.md)

</td><td>

Result of attempting to resolve an ingredient reference.

</td></tr>
<tr><td>

[IQueryResult](./interfaces/IQueryResult.md)

</td><td>

Result of a query execution with metadata

</td></tr>
<tr><td>

[INumericRange](./interfaces/INumericRange.md)

</td><td>

Range specification for numeric filtering

</td></tr>
<tr><td>

[IIterationOptions](./interfaces/IIterationOptions.md)

</td><td>

Options for iterating over runtime entities

</td></tr>
<tr><td>

[IIngredientQueryOptions](./interfaces/IIngredientQueryOptions.md)

</td><td>

Options for ingredient queries on recipes.

</td></tr>
<tr><td>

[IIngredientUsageInfo](./interfaces/IIngredientUsageInfo.md)

</td><td>

Information about how an ingredient is used in a recipe.

</td></tr>
<tr><td>

[ILibraryRuntimeContext](./interfaces/ILibraryRuntimeContext.md)

</td><td>

Central context for the library-runtime object access layer.

</td></tr>
<tr><td>

[IConfectionBase](./interfaces/IConfectionBase.md)

</td><td>

Base interface for all runtime confections.

</td></tr>
<tr><td>

[IMoldedBonBonRecipe](./interfaces/IMoldedBonBonRecipe.md)

</td><td>

Runtime confection narrowed to molded bonbon type.

</td></tr>
<tr><td>

[IBarTruffleRecipe](./interfaces/IBarTruffleRecipe.md)

</td><td>

Runtime confection narrowed to bar truffle type.

</td></tr>
<tr><td>

[IRolledTruffleRecipe](./interfaces/IRolledTruffleRecipe.md)

</td><td>

Runtime confection narrowed to rolled truffle type.

</td></tr>
<tr><td>

[IResolvedRecipeFillingOption](./interfaces/IResolvedRecipeFillingOption.md)

</td><td>

Resolved recipe filling option.

</td></tr>
<tr><td>

[IResolvedIngredientFillingOption](./interfaces/IResolvedIngredientFillingOption.md)

</td><td>

Resolved ingredient filling option.

</td></tr>
<tr><td>

[IResolvedFillingSlot](./interfaces/IResolvedFillingSlot.md)

</td><td>

A resolved filling slot with resolved recipe/ingredient references.

</td></tr>
<tr><td>

[IResolvedChocolateSpec](./interfaces/IResolvedChocolateSpec.md)

</td><td>

A resolved chocolate specification with ingredient objects.

</td></tr>
<tr><td>

[IResolvedAdditionalChocolate](./interfaces/IResolvedAdditionalChocolate.md)

</td><td>

Resolved additional chocolate with purpose.

</td></tr>
<tr><td>

[IResolvedConfectionMoldRef](./interfaces/IResolvedConfectionMoldRef.md)

</td><td>

A resolved mold reference with the full mold object.

</td></tr>
<tr><td>

[IResolvedConfectionProcedure](./interfaces/IResolvedConfectionProcedure.md)

</td><td>

Resolved procedure reference for confections.

</td></tr>
<tr><td>

[IResolvedCoatings](./interfaces/IResolvedCoatings.md)

</td><td>

Resolved coatings specification for rolled truffles.

</td></tr>
<tr><td>

[IResolvedCoatingOption](./interfaces/IResolvedCoatingOption.md)

</td><td>

A resolved coating option with the full ingredient object.

</td></tr>
<tr><td>

[IConfectionRecipeVariationBase](./interfaces/IConfectionRecipeVariationBase.md)

</td><td>

A resolved runtime view of a confection variation with resolved references.

</td></tr>
<tr><td>

[IMoldedBonBonRecipeVariation](./interfaces/IMoldedBonBonRecipeVariation.md)

</td><td>

Runtime confection variation narrowed to molded bonbon type.

</td></tr>
<tr><td>

[IBarTruffleRecipeVariation](./interfaces/IBarTruffleRecipeVariation.md)

</td><td>

Runtime confection variation narrowed to bar truffle type.

</td></tr>
<tr><td>

[IRolledTruffleRecipeVariation](./interfaces/IRolledTruffleRecipeVariation.md)

</td><td>

Runtime confection variation narrowed to rolled truffle type.

</td></tr>
<tr><td>

[IGanacheAnalysis](./interfaces/IGanacheAnalysis.md)

</td><td>

Blended characteristics for a ganache recipe

</td></tr>
<tr><td>

[IGanacheValidation](./interfaces/IGanacheValidation.md)

</td><td>

Validation result for ganache ratios

</td></tr>
<tr><td>

[IGanacheCalculation](./interfaces/IGanacheCalculation.md)

</td><td>

Complete ganache calculation result

</td></tr>
<tr><td>

[IResolvedIngredient](./interfaces/IResolvedIngredient.md)

</td><td>

Resolved ingredient with its amount

</td></tr>
<tr><td>

[IFillingChanges](./interfaces/IFillingChanges.md)

</td><td>

Structure describing what changed between two produced fillings

</td></tr>
<tr><td>

[IConfectionChanges](./interfaces/IConfectionChanges.md)

</td><td>

Structure describing what changed between two produced confections

</td></tr>
<tr><td>

[ILibraryRuntimeContextCreateParams](./interfaces/ILibraryRuntimeContextCreateParams.md)

</td><td>

Parameters for creating a LibraryRuntimeContext with a new library

</td></tr>
<tr><td>

[IFindOrchestrator](./interfaces/IFindOrchestrator.md)

</td><td>

Interface for an orchestrator that provides find functionality.

</td></tr>
<tr><td>

[IReadOnlyValidatingLibrary](./interfaces/IReadOnlyValidatingLibrary.md)

</td><td>

Read-only interface for ValidatingLibrary.

</td></tr>
<tr><td>

[IValidatingLibraryParams](./interfaces/IValidatingLibraryParams.md)

</td><td>

Parameters for ValidatingLibrary construction.

</td></tr>
<tr><td>

[IMaterializedLibraryParams](./interfaces/IMaterializedLibraryParams.md)

</td><td>

Parameters for constructing a MaterializedLibrary.

</td></tr>
<tr><td>

[ITask](./interfaces/ITask.md)

</td><td>

A resolved view of a task with rendering capabilities.

</td></tr>
<tr><td>

[IProcedure](./interfaces/IProcedure.md)

</td><td>

A resolved runtime view of a procedure with rendering capabilities.

</td></tr>
<tr><td>

[IProcedureRenderContext](./interfaces/IProcedureRenderContext.md)

</td><td>

Context for rendering a procedure with full library access.

</td></tr>
<tr><td>

[IRenderedProcedure](./interfaces/IRenderedProcedure.md)

</td><td>

A rendered procedure with all template values resolved.

</td></tr>
<tr><td>

[IRenderedStep](./interfaces/IRenderedStep.md)

</td><td>

A rendered procedure step with resolved template values.

</td></tr>
<tr><td>

[IMold](./interfaces/IMold.md)

</td><td>

A resolved runtime view of a mold with computed properties.

</td></tr>
</tbody></table>

## Type Aliases

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[FillingRecipeIngredientsFilter](./type-aliases/FillingRecipeIngredientsFilter.md)

</td><td>

Filter for recipe ingredients.

</td></tr>
<tr><td>

[ResolutionStatus](./type-aliases/ResolutionStatus.md)

</td><td>

Status of a resolution attempt for an ingredient

</td></tr>
<tr><td>

[ComparisonOperator](./type-aliases/ComparisonOperator.md)

</td><td>

Comparison operators for numeric filters

</td></tr>
<tr><td>

[IResolvedFillingOption](./type-aliases/IResolvedFillingOption.md)

</td><td>

A resolved filling option with the full recipe or ingredient object.

</td></tr>
<tr><td>

[AnyConfectionRecipeVariation](./type-aliases/AnyConfectionRecipeVariation.md)

</td><td>

Union type for all runtime confection variation types.

</td></tr>
<tr><td>

[IngredientResolver](./type-aliases/IngredientResolver.md)

</td><td>

Function type for resolving an ingredient ID to its full ingredient data

</td></tr>
<tr><td>

[FilterPredicate](./type-aliases/FilterPredicate.md)

</td><td>

Generic filter predicate function

</td></tr>
<tr><td>

[IngredientFilter](./type-aliases/IngredientFilter.md)

</td><td>

Filter for RuntimeIngredient

</td></tr>
<tr><td>

[FillingRecipeFilter](./type-aliases/FillingRecipeFilter.md)

</td><td>

Filter for RuntimeFillingRecipe

</td></tr>
<tr><td>

[AnyIngredient](./type-aliases/AnyIngredient.md)

</td><td>

Union type of all concrete runtime ingredient classes.

</td></tr>
<tr><td>

[AnyConfection](./type-aliases/AnyConfection.md)

</td><td>

Union type of all concrete confection classes.

</td></tr>
</tbody></table>

## Functions

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[andFilters](./functions/andFilters.md)

</td><td>

Combines multiple filters with AND logic.

</td></tr>
<tr><td>

[orFilters](./functions/orFilters.md)

</td><td>

Combines multiple filters with OR logic.

</td></tr>
<tr><td>

[notFilter](./functions/notFilter.md)

</td><td>

Negates a filter.

</td></tr>
<tr><td>

[containsIgnoreCase](./functions/containsIgnoreCase.md)

</td><td>

Creates a case-insensitive contains filter.

</td></tr>
<tr><td>

[hasTag](./functions/hasTag.md)

</td><td>

Creates a tag filter that checks if item has the specified tag.

</td></tr>
<tr><td>

[hasAnyTag](./functions/hasAnyTag.md)

</td><td>

Creates a filter that checks if item has any of the specified tags.

</td></tr>
<tr><td>

[hasAllTags](./functions/hasAllTags.md)

</td><td>

Creates a filter that checks if item has all of the specified tags.

</td></tr>
<tr><td>

[inRange](./functions/inRange.md)

</td><td>

Creates a filter for numeric range (inclusive).

</td></tr>
<tr><td>

[atLeast](./functions/atLeast.md)

</td><td>

Creates a filter for minimum value (inclusive).

</td></tr>
<tr><td>

[atMost](./functions/atMost.md)

</td><td>

Creates a filter for maximum value (inclusive).

</td></tr>
<tr><td>

[collectionContains](./functions/collectionContains.md)

</td><td>

Creates a filter that checks if a collection contains a value.

</td></tr>
<tr><td>

[collectionContainsAny](./functions/collectionContainsAny.md)

</td><td>

Creates a filter that checks if a collection contains any of the values.

</td></tr>
<tr><td>

[equals](./functions/equals.md)

</td><td>

Creates a filter for exact equality.

</td></tr>
<tr><td>

[oneOf](./functions/oneOf.md)

</td><td>

Creates a filter that checks if value is one of the allowed values.

</td></tr>
</tbody></table>
