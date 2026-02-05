[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [LibraryRuntime](../../../README.md) / [Internal](../README.md) / IVersionScaleOptions

# Interface: IVersionScaleOptions

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingScaler.ts:37](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingScaler.ts#L37)

Options for version scaling (precision and minimum amount only)

## Extended by

- [`IFillingRecipeScaleOptions`](IFillingRecipeScaleOptions.md)

## Properties

### minimumAmount?

> `readonly` `optional` **minimumAmount**: [`Measurement`](../../../../../../type-aliases/Measurement.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingScaler.ts:47](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingScaler.ts#L47)

Minimum amount to show in scaled filling recipe (default: 0.1)
Amounts below this threshold will be rounded up to it

***

### precision?

> `readonly` `optional` **precision**: `number`

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingScaler.ts:41](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingScaler.ts#L41)

Number of decimal places for scaled amounts (default: 1)
