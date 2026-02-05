[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [LibraryRuntime](../../../README.md) / [Internal](../README.md) / IFillingRecipeScaleOptions

# Interface: IFillingRecipeScaleOptions

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingScaler.ts:54](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingScaler.ts#L54)

Options for filling recipe scaling (extends version options with version selection)

## Extends

- [`IVersionScaleOptions`](IVersionScaleOptions.md)

## Properties

### minimumAmount?

> `readonly` `optional` **minimumAmount**: [`Measurement`](../../../../../../type-aliases/Measurement.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingScaler.ts:47](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingScaler.ts#L47)

Minimum amount to show in scaled filling recipe (default: 0.1)
Amounts below this threshold will be rounded up to it

#### Inherited from

[`IVersionScaleOptions`](IVersionScaleOptions.md).[`minimumAmount`](IVersionScaleOptions.md#minimumamount)

***

### precision?

> `readonly` `optional` **precision**: `number`

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingScaler.ts:41](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingScaler.ts#L41)

Number of decimal places for scaled amounts (default: 1)

#### Inherited from

[`IVersionScaleOptions`](IVersionScaleOptions.md).[`precision`](IVersionScaleOptions.md#precision)

***

### versionSpec?

> `readonly` `optional` **versionSpec**: [`FillingVersionSpec`](../../../../../../type-aliases/FillingVersionSpec.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingScaler.ts:58](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingScaler.ts#L58)

Filling recipe version to scale (default: golden version)
