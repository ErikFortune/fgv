[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [LibraryRuntime](../../../README.md) / [Internal](../README.md) / IWeightCalculationContext

# Interface: IWeightCalculationContext

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingWeightCalculator.ts:38](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingWeightCalculator.ts#L38)

Context for weight calculations that provides ingredient density lookup.
Implementations should resolve ingredient IDs to their density values.

## Methods

### getIngredientDensity()

> **getIngredientDensity**(`id`): `number`

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingWeightCalculator.ts:44](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingWeightCalculator.ts#L44)

Get the density (g/mL) for an ingredient.

#### Parameters

##### id

[`IngredientId`](../../../../../../type-aliases/IngredientId.md)

The ingredient ID to look up

#### Returns

`number`

The density in g/mL, or 1.0 if not specified
