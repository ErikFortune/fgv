[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Validation](../README.md) / toPercentage

# Function: toPercentage()

> **toPercentage**(`from`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Percentage`](../../../../type-aliases/Percentage.md)\>

Defined in: [ts-chocolate/src/packlets/common/validation.ts:529](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/common/validation.ts#L529)

Validates unknown value is a [Percentage](../../../../type-aliases/Percentage.md).

## Parameters

### from

`unknown`

Value to validate

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Percentage`](../../../../type-aliases/Percentage.md)\>

`Success` with [Percentage](../../../../type-aliases/Percentage.md) or `Failure` with an
error message if validation fails.
