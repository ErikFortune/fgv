[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [LibraryRuntime](../../../README.md) / [Internal](../README.md) / calculateFromFillingRecipeIngredients

# Function: calculateFromFillingRecipeIngredients()

> **calculateFromFillingRecipeIngredients**(`recipeIngredients`, `resolver`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IGanacheAnalysis`](../../../interfaces/IGanacheAnalysis.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/ganacheCalculator.ts:174](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/internal/ganacheCalculator.ts#L174)

Resolves recipe ingredients and calculates blended characteristics

## Parameters

### recipeIngredients

readonly [`IFillingIngredientEntity`](../../../../Entities/namespaces/Fillings/interfaces/IFillingIngredientEntity.md)[]

Recipe ingredient references

### resolver

[`IngredientResolver`](../../../type-aliases/IngredientResolver.md)

Function to resolve ingredient IDs to full data

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IGanacheAnalysis`](../../../interfaces/IGanacheAnalysis.md)\>

Success with ganache analysis, or Failure if resolution fails
