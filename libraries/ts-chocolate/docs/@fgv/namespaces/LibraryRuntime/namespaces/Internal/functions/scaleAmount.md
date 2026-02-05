[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [LibraryRuntime](../../../README.md) / [Internal](../README.md) / scaleAmount

# Function: scaleAmount()

> **scaleAmount**(`amount`, `unit`, `factor`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IScaledAmount`](../interfaces/IScaledAmount.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts:402](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/internal/fillingUnitScaler.ts#L402)

Scale an ingredient amount using the appropriate scaler for the unit

## Parameters

### amount

[`Measurement`](../../../../../../type-aliases/Measurement.md)

The amount to scale

### unit

[`MeasurementUnit`](../../../../../../type-aliases/MeasurementUnit.md)

The measurement unit

### factor

`number`

The scaling factor

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IScaledAmount`](../interfaces/IScaledAmount.md)\>

The scaled amount with display information
