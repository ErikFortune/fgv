[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [LibraryRuntime](../../../README.md) / [Internal](../README.md) / calculateGanache

# Function: calculateGanache()

> **calculateGanache**(`recipe`, `resolver`, `versionSpec?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IGanacheCalculation`](../../../interfaces/IGanacheCalculation.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/ganacheCalculator.ts:338](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/internal/ganacheCalculator.ts#L338)

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
