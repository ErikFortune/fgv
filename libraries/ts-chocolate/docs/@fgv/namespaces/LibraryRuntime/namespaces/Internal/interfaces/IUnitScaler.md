[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [LibraryRuntime](../../../README.md) / [Internal](../README.md) / IUnitScaler

# Interface: IUnitScaler

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts:89](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts#L89)

Interface for unit-specific scalers

## Properties

### supportsScaling

> `readonly` **supportsScaling**: `boolean`

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts:91](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts#L91)

Whether this unit supports scaling

## Methods

### scale()

> **scale**(`amount`, `factor`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IScaledAmount`](IScaledAmount.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts:99](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts#L99)

Scale an amount by a factor

#### Parameters

##### amount

[`Measurement`](../../../../../../type-aliases/Measurement.md)

The original amount

##### factor

`number`

The scaling factor

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IScaledAmount`](IScaledAmount.md)\>

Scaled amount with display information
