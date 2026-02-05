[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Validation](../README.md) / toCelsius

# Function: toCelsius()

> **toCelsius**(`from`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Celsius`](../../../../type-aliases/Celsius.md)\>

Defined in: [ts-chocolate/src/packlets/common/validation.ts:553](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/common/validation.ts#L553)

Validates unknown value is a [Celsius](../../../../type-aliases/Celsius.md).

## Parameters

### from

`unknown`

Value to validate

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Celsius`](../../../../type-aliases/Celsius.md)\>

`Success` with [Celsius](../../../../type-aliases/Celsius.md) or `Failure` with an error
message if validation fails.
