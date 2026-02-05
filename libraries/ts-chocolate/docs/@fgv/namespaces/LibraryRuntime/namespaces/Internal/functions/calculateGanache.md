[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [LibraryRuntime](../../../README.md) / [Internal](../README.md) / calculateGanache

# Function: calculateGanache()

> **calculateGanache**(`recipe`, `resolver`, `versionSpec?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IGanacheCalculation`](../../../interfaces/IGanacheCalculation.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/ganacheCalculator.ts:338](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/internal/ganacheCalculator.ts#L338)

Performs complete ganache calculation with validation

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

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IGanacheCalculation`](../../../interfaces/IGanacheCalculation.md)\>

Success with complete calculation, or Failure if resolution fails
