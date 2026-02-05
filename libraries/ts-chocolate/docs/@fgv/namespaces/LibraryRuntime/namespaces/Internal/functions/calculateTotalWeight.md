[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [LibraryRuntime](../../../README.md) / [Internal](../README.md) / calculateTotalWeight

# Function: calculateTotalWeight()

> **calculateTotalWeight**(`ingredients`, `context`): [`Measurement`](../../../../../../type-aliases/Measurement.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingWeightCalculator.ts:187](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingWeightCalculator.ts#L187)

Calculate the total weight from all ingredients with unit conversion.

This function handles mixed-unit filling recipes by:
- Adding grams directly
- Converting milliliters to grams via ingredient density
- Excluding tsp, Tbsp, and pinch measurements

## Parameters

### ingredients

readonly [`IFillingIngredientEntity`](../../../../Entities/namespaces/Fillings/interfaces/IFillingIngredientEntity.md)[]

Array of filling recipe ingredients

### context

[`IWeightCalculationContext`](../interfaces/IWeightCalculationContext.md) = `defaultWeightContext`

Context for looking up ingredient densities

## Returns

[`Measurement`](../../../../../../type-aliases/Measurement.md)

Total weight in grams
