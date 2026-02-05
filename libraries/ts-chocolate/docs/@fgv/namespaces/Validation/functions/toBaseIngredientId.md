[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Validation](../README.md) / toBaseIngredientId

# Function: toBaseIngredientId()

> **toBaseIngredientId**(`from`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`BaseIngredientId`](../../../../type-aliases/BaseIngredientId.md)\>

Defined in: [ts-chocolate/src/packlets/common/validation.ts:117](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/common/validation.ts#L117)

Validates unknown value is a [BaseIngredientId](../../../../type-aliases/BaseIngredientId.md).

## Parameters

### from

`unknown`

Value to validate

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`BaseIngredientId`](../../../../type-aliases/BaseIngredientId.md)\>

`Success` with [BaseIngredientId](../../../../type-aliases/BaseIngredientId.md) or `Failure` with an error
message if validation fails.
