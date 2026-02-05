[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [LibraryRuntime](../../../README.md) / [Internal](../README.md) / SpoonScaler

# Class: SpoonScaler

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts:199](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts#L199)

Scaler for spoon measurements (tsp/Tbsp) with fractional support.
Handles conversion between tsp and Tbsp (1 Tbsp = 3 tsp).

## Implements

- [`IUnitScaler`](../interfaces/IUnitScaler.md)

## Constructors

### Constructor

> **new SpoonScaler**(`sourceUnit`, `options`): `SpoonScaler`

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts:205](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts#L205)

#### Parameters

##### sourceUnit

[`SpoonUnit`](../../../../../../type-aliases/SpoonUnit.md)

##### options

[`ISpoonScalerOptions`](../interfaces/ISpoonScalerOptions.md) = `{}`

#### Returns

`SpoonScaler`

## Properties

### supportsScaling

> `readonly` **supportsScaling**: `boolean` = `true`

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts:200](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts#L200)

Whether this unit supports scaling

#### Implementation of

[`IUnitScaler`](../interfaces/IUnitScaler.md).[`supportsScaling`](../interfaces/IUnitScaler.md#supportsscaling)

## Methods

### scale()

> **scale**(`amount`, `factor`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IScaledAmount`](../interfaces/IScaledAmount.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts:213](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts#L213)

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
