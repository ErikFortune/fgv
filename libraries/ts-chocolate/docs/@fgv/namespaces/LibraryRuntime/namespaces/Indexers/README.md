[**@fgv/ts-chocolate**](../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../README.md) / [LibraryRuntime](../../README.md) / Indexers

# Indexers

Extensible indexer infrastructure for efficient reverse lookups

This module provides:
- Base indexer class with common functionality
- Concrete indexers for various query types
- Type-specific orchestrators for unified query execution

## Classes

- [BaseIndexer](classes/BaseIndexer.md)
- [BaseIndexerOrchestrator](classes/BaseIndexerOrchestrator.md)
- [FillingRecipeIndexerOrchestrator](classes/FillingRecipeIndexerOrchestrator.md)
- [FillingRecipesByCategoryIndexer](classes/FillingRecipesByCategoryIndexer.md)
- [FillingRecipesByChocolateTypeIndexer](classes/FillingRecipesByChocolateTypeIndexer.md)
- [FillingRecipesByIngredientIndexer](classes/FillingRecipesByIngredientIndexer.md)
- [FillingRecipesByTagIndexer](classes/FillingRecipesByTagIndexer.md)
- [IngredientIndexerOrchestrator](classes/IngredientIndexerOrchestrator.md)
- [IngredientsByTagIndexer](classes/IngredientsByTagIndexer.md)

## Interfaces

- [IEntityResolver](interfaces/IEntityResolver.md)
- [IFillingRecipeQuerySpec](interfaces/IFillingRecipeQuerySpec.md)
- [IFillingRecipesByCategoryConfig](interfaces/IFillingRecipesByCategoryConfig.md)
- [IFillingRecipesByChocolateTypeConfig](interfaces/IFillingRecipesByChocolateTypeConfig.md)
- [IFillingRecipesByIngredientConfig](interfaces/IFillingRecipesByIngredientConfig.md)
- [IFillingRecipesByTagConfig](interfaces/IFillingRecipesByTagConfig.md)
- [IFindOptions](interfaces/IFindOptions.md)
- [IIndexer](interfaces/IIndexer.md)
- [IIngredientQuerySpec](interfaces/IIngredientQuerySpec.md)
- [IIngredientsByTagConfig](interfaces/IIngredientsByTagConfig.md)

## Type Aliases

- [AggregationMode](type-aliases/AggregationMode.md)
- [FillingRecipeIndexerName](type-aliases/FillingRecipeIndexerName.md)
- [FillingRecipeResolver](type-aliases/FillingRecipeResolver.md)
- [IngredientIndexerName](type-aliases/IngredientIndexerName.md)
- [IngredientResolver](type-aliases/IngredientResolver.md)
- [IngredientUsageType](type-aliases/IngredientUsageType.md)

## Variables

- [fillingRecipeQuerySpecConverter](variables/fillingRecipeQuerySpecConverter.md)
- [fillingRecipesByCategoryConfigConverter](variables/fillingRecipesByCategoryConfigConverter.md)
- [fillingRecipesByChocolateTypeConfigConverter](variables/fillingRecipesByChocolateTypeConfigConverter.md)
- [fillingRecipesByIngredientConfigConverter](variables/fillingRecipesByIngredientConfigConverter.md)
- [fillingRecipesByTagConfigConverter](variables/fillingRecipesByTagConfigConverter.md)
- [ingredientQuerySpecConverter](variables/ingredientQuerySpecConverter.md)
- [ingredientsByTagConfigConverter](variables/ingredientsByTagConfigConverter.md)

## Functions

- [fillingRecipesByCategoryConfig](functions/fillingRecipesByCategoryConfig.md)
- [fillingRecipesByChocolateTypeConfig](functions/fillingRecipesByChocolateTypeConfig.md)
- [fillingRecipesByIngredientConfig](functions/fillingRecipesByIngredientConfig.md)
- [fillingRecipesByTagConfig](functions/fillingRecipesByTagConfig.md)
- [ingredientsByTagConfig](functions/ingredientsByTagConfig.md)
