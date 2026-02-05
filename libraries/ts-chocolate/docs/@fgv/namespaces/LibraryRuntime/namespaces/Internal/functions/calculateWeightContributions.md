[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [LibraryRuntime](../../../README.md) / [Internal](../README.md) / calculateWeightContributions

# Function: calculateWeightContributions()

> **calculateWeightContributions**(`ingredients`, `context`): [`IWeightContribution`](../interfaces/IWeightContribution.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingWeightCalculator.ts:210](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingWeightCalculator.ts#L210)

Calculate weight contributions for all ingredients.
Returns detailed breakdown of how each ingredient contributes to total weight.

## Parameters

### ingredients

readonly [`IFillingIngredientEntity`](../../../../Entities/namespaces/Fillings/interfaces/IFillingIngredientEntity.md)[]

Array of filling recipe ingredients

### context

[`IWeightCalculationContext`](../interfaces/IWeightCalculationContext.md) = `defaultWeightContext`

Context for looking up ingredient densities

## Returns

[`IWeightContribution`](../interfaces/IWeightContribution.md)[]

Array of weight contributions for each ingredient
