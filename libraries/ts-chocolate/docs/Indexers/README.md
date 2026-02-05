[Home](../README.md) > Indexers

# Namespace: Indexers

Extensible indexer infrastructure for efficient reverse lookups

This module provides:
- Base indexer class with common functionality
- Concrete indexers for various query types
- Type-specific orchestrators for unified query execution

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[BaseIndexer](./classes/BaseIndexer.md)

</td><td>

Abstract base class for indexers providing common functionality.

</td></tr>
<tr><td>

[BaseIndexerOrchestrator](./classes/BaseIndexerOrchestrator.md)

</td><td>

Base class for index orchestrators that provides common

</td></tr>
<tr><td>

[FillingRecipesByIngredientIndexer](./classes/FillingRecipesByIngredientIndexer.md)

</td><td>

Indexer that finds recipes using a specific ingredient.

</td></tr>
<tr><td>

[FillingRecipesByTagIndexer](./classes/FillingRecipesByTagIndexer.md)

</td><td>

Indexer that finds recipes with a specific tag.

</td></tr>
<tr><td>

[IngredientsByTagIndexer](./classes/IngredientsByTagIndexer.md)

</td><td>

Indexer that finds ingredients with a specific tag.

</td></tr>
<tr><td>

[FillingRecipesByChocolateTypeIndexer](./classes/FillingRecipesByChocolateTypeIndexer.md)

</td><td>

Indexer that finds recipes containing a specific chocolate type.

</td></tr>
<tr><td>

[FillingRecipesByCategoryIndexer](./classes/FillingRecipesByCategoryIndexer.md)

</td><td>

Indexer that finds recipes with a specific category.

</td></tr>
<tr><td>

[FillingRecipeIndexerOrchestrator](./classes/FillingRecipeIndexerOrchestrator.md)

</td><td>

Orchestrator for filling recipe indexers.

</td></tr>
<tr><td>

[IngredientIndexerOrchestrator](./classes/IngredientIndexerOrchestrator.md)

</td><td>

Orchestrator for ingredient indexers.

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

[IIndexer](./interfaces/IIndexer.md)

</td><td>

Interface for a single indexer that can find entity IDs matching a query config.

</td></tr>
<tr><td>

[IEntityResolver](./interfaces/IEntityResolver.md)

</td><td>

Interface for resolving entity IDs to entities.

</td></tr>
<tr><td>

[IFindOptions](./interfaces/IFindOptions.md)

</td><td>

Options for the find operation.

</td></tr>
<tr><td>

[IFillingRecipesByIngredientConfig](./interfaces/IFillingRecipesByIngredientConfig.md)

</td><td>

Configuration for the RecipesByIngredient indexer.

</td></tr>
<tr><td>

[IFillingRecipesByTagConfig](./interfaces/IFillingRecipesByTagConfig.md)

</td><td>

Configuration for the RecipesByTag indexer.

</td></tr>
<tr><td>

[IIngredientsByTagConfig](./interfaces/IIngredientsByTagConfig.md)

</td><td>

Configuration for the IngredientsByTag indexer.

</td></tr>
<tr><td>

[IFillingRecipesByChocolateTypeConfig](./interfaces/IFillingRecipesByChocolateTypeConfig.md)

</td><td>

Configuration for the RecipesByChocolateType indexer.

</td></tr>
<tr><td>

[IFillingRecipesByCategoryConfig](./interfaces/IFillingRecipesByCategoryConfig.md)

</td><td>

Configuration for the RecipesByCategory indexer.

</td></tr>
<tr><td>

[IFillingRecipeQuerySpec](./interfaces/IFillingRecipeQuerySpec.md)

</td><td>

Query specification for filling recipe indexers.

</td></tr>
<tr><td>

[IIngredientQuerySpec](./interfaces/IIngredientQuerySpec.md)

</td><td>

Query specification for ingredient indexers.

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

[AggregationMode](./type-aliases/AggregationMode.md)

</td><td>

Aggregation mode for combining results from multiple indexers.

</td></tr>
<tr><td>

[IngredientUsageType](./type-aliases/IngredientUsageType.md)

</td><td>

Usage type filter for ingredient lookups.

</td></tr>
<tr><td>

[FillingRecipeIndexerName](./type-aliases/FillingRecipeIndexerName.md)

</td><td>

Valid filling recipe indexer names (inferred from query spec keys).

</td></tr>
<tr><td>

[FillingRecipeResolver](./type-aliases/FillingRecipeResolver.md)

</td><td>

Filling recipe resolver function type.

</td></tr>
<tr><td>

[IngredientIndexerName](./type-aliases/IngredientIndexerName.md)

</td><td>

Valid ingredient indexer names (inferred from query spec keys).

</td></tr>
<tr><td>

[IngredientResolver](./type-aliases/IngredientResolver.md)

</td><td>

Ingredient resolver function type.

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

[fillingRecipesByIngredientConfig](./functions/fillingRecipesByIngredientConfig.md)

</td><td>

Creates a RecipesByIngredient config.

</td></tr>
<tr><td>

[fillingRecipesByTagConfig](./functions/fillingRecipesByTagConfig.md)

</td><td>

Creates a RecipesByTag config.

</td></tr>
<tr><td>

[ingredientsByTagConfig](./functions/ingredientsByTagConfig.md)

</td><td>

Creates an IngredientsByTag config.

</td></tr>
<tr><td>

[fillingRecipesByChocolateTypeConfig](./functions/fillingRecipesByChocolateTypeConfig.md)

</td><td>

Creates a RecipesByChocolateType config.

</td></tr>
<tr><td>

[fillingRecipesByCategoryConfig](./functions/fillingRecipesByCategoryConfig.md)

</td><td>

Creates a RecipesByCategory config.

</td></tr>
</tbody></table>

## Variables

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[fillingRecipesByIngredientConfigConverter](./variables/fillingRecipesByIngredientConfigConverter.md)

</td><td>

Converter for RecipesByIngredient config from JSON.

</td></tr>
<tr><td>

[fillingRecipesByTagConfigConverter](./variables/fillingRecipesByTagConfigConverter.md)

</td><td>

Converter for RecipesByTag config from JSON.

</td></tr>
<tr><td>

[ingredientsByTagConfigConverter](./variables/ingredientsByTagConfigConverter.md)

</td><td>

Converter for IngredientsByTag config from JSON.

</td></tr>
<tr><td>

[fillingRecipesByChocolateTypeConfigConverter](./variables/fillingRecipesByChocolateTypeConfigConverter.md)

</td><td>

Converter for RecipesByChocolateType config from JSON.

</td></tr>
<tr><td>

[fillingRecipesByCategoryConfigConverter](./variables/fillingRecipesByCategoryConfigConverter.md)

</td><td>

Converter for RecipesByCategory config from JSON.

</td></tr>
<tr><td>

[fillingRecipeQuerySpecConverter](./variables/fillingRecipeQuerySpecConverter.md)

</td><td>

Converter for filling recipe query specification from JSON.

</td></tr>
<tr><td>

[ingredientQuerySpecConverter](./variables/ingredientQuerySpecConverter.md)

</td><td>

Converter for ingredient query specification from JSON.

</td></tr>
</tbody></table>
