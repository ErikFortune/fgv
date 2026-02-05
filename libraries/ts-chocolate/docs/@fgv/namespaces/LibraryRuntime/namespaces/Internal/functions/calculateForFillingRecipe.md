[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [LibraryRuntime](../../../README.md) / [Internal](../README.md) / calculateForFillingRecipe

# Function: calculateForFillingRecipe()

> **calculateForFillingRecipe**(`recipe`, `resolver`, `versionSpec?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IGanacheAnalysis`](../../../interfaces/IGanacheAnalysis.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/ganacheCalculator.ts:207](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/internal/ganacheCalculator.ts#L207)

Resolves and calculates characteristics for a complete recipe

## Parameters

### recipe

[`IFillingRecipeEntity`](../../../../Entities/interfaces/IFillingRecipeEntity.md)

The recipe to analyze

### resolver

[`IngredientResolver`](../../../type-aliases/IngredientResolver.md)

Function to resolve ingredient IDs to full data

### versionSpec?

[`FillingVersionSpec`](../../../../../../type-aliases/FillingVersionSpec.md)

Optional version ID (default: golden version)

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IGanacheAnalysis`](../../../interfaces/IGanacheAnalysis.md)\>

Success with ganache analysis, or Failure if resolution fails
