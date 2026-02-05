[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [LibraryRuntime](../../../README.md) / [Internal](../README.md) / UnitScalerRegistry

# Class: UnitScalerRegistry

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts:323](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts#L323)

Registry of unit scalers.
Maps measurement units to their appropriate scalers.
Falls back to a default linear scaler for unknown units.

## Constructors

### Constructor

> **new UnitScalerRegistry**(): `UnitScalerRegistry`

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts:327](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts#L327)

#### Returns

`UnitScalerRegistry`

## Methods

### getScaler()

> **getScaler**(`unit`): [`IUnitScaler`](../interfaces/IUnitScaler.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts:349](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts#L349)

Get the scaler for a specific unit

#### Parameters

##### unit

[`MeasurementUnit`](../../../../../../type-aliases/MeasurementUnit.md)

The measurement unit

#### Returns

[`IUnitScaler`](../interfaces/IUnitScaler.md)

The appropriate scaler (falls back to linear scaler for unknown units)

***

### scale()

> **scale**(`amount`, `unit`, `factor`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IScaledAmount`](../interfaces/IScaledAmount.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts:369](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts#L369)

Scale an amount in the specified unit

#### Parameters

##### amount

[`Measurement`](../../../../../../type-aliases/Measurement.md)

The amount to scale

##### unit

[`MeasurementUnit`](../../../../../../type-aliases/MeasurementUnit.md)

The measurement unit

##### factor

`number`

The scaling factor

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IScaledAmount`](../interfaces/IScaledAmount.md)\>

The scaled amount with display information

***

### supportsScaling()

> **supportsScaling**(`unit`): `boolean`

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts:358](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts#L358)

Check if a unit supports scaling

#### Parameters

##### unit

[`MeasurementUnit`](../../../../../../type-aliases/MeasurementUnit.md)

The measurement unit

#### Returns

`boolean`

True if the unit supports scaling
