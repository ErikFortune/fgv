[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Validation](../README.md) / toMeasurement

# Function: toMeasurement()

> **toMeasurement**(`from`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Measurement`](../../../../type-aliases/Measurement.md)\>

Defined in: [ts-chocolate/src/packlets/common/validation.ts:505](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/common/validation.ts#L505)

Validates unknown value is a [Measurement](../../../../type-aliases/Measurement.md).

## Parameters

### from

`unknown`

Value to validate

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Measurement`](../../../../type-aliases/Measurement.md)\>

`Success` with [Measurement](../../../../type-aliases/Measurement.md) or `Failure` with an error
message if validation fails.
