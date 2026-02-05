[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [LibraryRuntime](../../../README.md) / [Internal](../README.md) / PinchScaler

# Class: PinchScaler

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts:163](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts#L163)

Scaler for pinch measurements - always returns the original amount.
Pinch is an imprecise measurement that doesn't scale linearly.

## Implements

- [`IUnitScaler`](../interfaces/IUnitScaler.md)

## Constructors

### Constructor

> **new PinchScaler**(): `PinchScaler`

#### Returns

`PinchScaler`

## Properties

### supportsScaling

> `readonly` **supportsScaling**: `boolean` = `false`

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts:164](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts#L164)

Whether this unit supports scaling

#### Implementation of

[`IUnitScaler`](../interfaces/IUnitScaler.md).[`supportsScaling`](../interfaces/IUnitScaler.md#supportsscaling)

## Methods

### scale()

> **scale**(`amount`, `_factor`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IScaledAmount`](../interfaces/IScaledAmount.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts:166](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts#L166)

Scale an amount by a factor

#### Parameters

##### amount

[`Measurement`](../../../../../../type-aliases/Measurement.md)

The original amount

##### \_factor

`number`

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IScaledAmount`](../interfaces/IScaledAmount.md)\>

Scaled amount with display information

#### Implementation of

[`IUnitScaler`](../interfaces/IUnitScaler.md).[`scale`](../interfaces/IUnitScaler.md#scale)
