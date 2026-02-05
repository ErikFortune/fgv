[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [LibraryRuntime](../../../README.md) / [Internal](../README.md) / IWeightContribution

# Interface: IWeightContribution

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingWeightCalculator.ts:55](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingWeightCalculator.ts#L55)

Result of calculating weight contribution for a single ingredient.

## Properties

### amount

> `readonly` **amount**: [`Measurement`](../../../../../../type-aliases/Measurement.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingWeightCalculator.ts:59](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingWeightCalculator.ts#L59)

Original amount in filling recipe

***

### contributesToWeight

> `readonly` **contributesToWeight**: `boolean`

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingWeightCalculator.ts:65](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingWeightCalculator.ts#L65)

Whether this ingredient contributes to total weight

***

### ingredientId

> `readonly` **ingredientId**: [`IngredientId`](../../../../../../type-aliases/IngredientId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingWeightCalculator.ts:57](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingWeightCalculator.ts#L57)

The preferred ingredient ID

***

### unit

> `readonly` **unit**: [`MeasurementUnit`](../../../../../../type-aliases/MeasurementUnit.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingWeightCalculator.ts:61](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingWeightCalculator.ts#L61)

Original unit in filling recipe

***

### weightGrams

> `readonly` **weightGrams**: [`Measurement`](../../../../../../type-aliases/Measurement.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingWeightCalculator.ts:63](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingWeightCalculator.ts#L63)

Weight contribution in grams (0 if excluded)
