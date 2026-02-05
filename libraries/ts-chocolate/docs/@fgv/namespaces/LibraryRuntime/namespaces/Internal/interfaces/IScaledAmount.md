[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [LibraryRuntime](../../../README.md) / [Internal](../README.md) / IScaledAmount

# Interface: IScaledAmount

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts:70](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts#L70)

Result of scaling an amount in a specific unit.
Contains both the raw scaled value and display-friendly representation.

## Properties

### displayValue

> `readonly` **displayValue**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts:76](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts#L76)

Display string (e.g., "1 1/2 tsp" or "2 Tbsp")

***

### scalable

> `readonly` **scalable**: `boolean`

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts:78](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts#L78)

Whether this unit supports scaling (false for pinch)

***

### unit

> `readonly` **unit**: [`MeasurementUnit`](../../../../../../type-aliases/MeasurementUnit.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts:74](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts#L74)

The unit of measurement

***

### value

> `readonly` **value**: [`Measurement`](../../../../../../type-aliases/Measurement.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts:72](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts#L72)

The raw scaled numeric value
