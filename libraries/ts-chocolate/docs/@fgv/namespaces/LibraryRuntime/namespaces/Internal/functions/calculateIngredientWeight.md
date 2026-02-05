[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [LibraryRuntime](../../../README.md) / [Internal](../README.md) / calculateIngredientWeight

# Function: calculateIngredientWeight()

> **calculateIngredientWeight**(`ingredient`, `context`): [`IWeightContribution`](../interfaces/IWeightContribution.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingWeightCalculator.ts:135](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingWeightCalculator.ts#L135)

Calculate the weight contribution for a single ingredient.

Weight rules:
- 'g': Added directly (amount in grams)
- 'mL': Converted to grams via density (amount * density)
- 'tsp', 'Tbsp', 'pinch': Excluded (returns 0)

## Parameters

### ingredient

[`IFillingIngredientEntity`](../../../../Entities/namespaces/Fillings/interfaces/IFillingIngredientEntity.md)

The filling recipe ingredient to calculate weight for

### context

[`IWeightCalculationContext`](../interfaces/IWeightCalculationContext.md) = `defaultWeightContext`

Context for looking up ingredient density

## Returns

[`IWeightContribution`](../interfaces/IWeightContribution.md)

The weight contribution including conversion details
