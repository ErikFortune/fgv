[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Validation](../README.md) / toMeasurement

# Function: toMeasurement()

> **toMeasurement**(`from`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Measurement`](../../../../type-aliases/Measurement.md)\>

Defined in: [ts-chocolate/src/packlets/common/validation.ts:505](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/common/validation.ts#L505)

Validates unknown value is a [Measurement](../../../../type-aliases/Measurement.md).

## Parameters

### from

`unknown`

Value to validate

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Measurement`](../../../../type-aliases/Measurement.md)\>

`Success` with [Measurement](../../../../type-aliases/Measurement.md) or `Failure` with an error
message if validation fails.
