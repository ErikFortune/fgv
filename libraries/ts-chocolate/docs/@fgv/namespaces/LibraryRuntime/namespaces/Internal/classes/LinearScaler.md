[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [LibraryRuntime](../../../README.md) / [Internal](../README.md) / LinearScaler

# Class: LinearScaler

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts:124](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts#L124)

Generic linear scaler for units like grams and milliliters.
Used as the default fallback for unknown units.

## Implements

- [`IUnitScaler`](../interfaces/IUnitScaler.md)

## Constructors

### Constructor

> **new LinearScaler**(`options`): `LinearScaler`

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts:131](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts#L131)

#### Parameters

##### options

[`ILinearScalerOptions`](../interfaces/ILinearScalerOptions.md)

#### Returns

`LinearScaler`

## Properties

### supportsScaling

> `readonly` **supportsScaling**: `boolean` = `true`

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts:125](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts#L125)

Whether this unit supports scaling

#### Implementation of

[`IUnitScaler`](../interfaces/IUnitScaler.md).[`supportsScaling`](../interfaces/IUnitScaler.md#supportsscaling)

## Methods

### scale()

> **scale**(`amount`, `factor`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IScaledAmount`](../interfaces/IScaledAmount.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts:137](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts#L137)

Scale an amount by a factor

#### Parameters

##### amount

[`Measurement`](../../../../../../type-aliases/Measurement.md)

The original amount

##### factor

`number`

The scaling factor

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IScaledAmount`](../interfaces/IScaledAmount.md)\>

Scaled amount with display information

#### Implementation of

[`IUnitScaler`](../interfaces/IUnitScaler.md).[`scale`](../interfaces/IUnitScaler.md#scale)
