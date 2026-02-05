[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Converters](../README.md) / numberInRange

# Function: numberInRange()

> **numberInRange**(`min`, `max`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`number`\>

Defined in: [ts-chocolate/src/packlets/common/converters.ts:885](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/common/converters.ts#L885)

Factory for creating range-constrained number converters.

## Parameters

### min

`number`

Minimum value (inclusive)

### max

`number`

Maximum value (inclusive)

## Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`number`\>

Converter that validates numbers are within the specified range
