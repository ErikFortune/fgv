[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Validation](../README.md) / toBaseIngredientId

# Function: toBaseIngredientId()

> **toBaseIngredientId**(`from`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`BaseIngredientId`](../../../../type-aliases/BaseIngredientId.md)\>

Defined in: [ts-chocolate/src/packlets/common/validation.ts:117](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/common/validation.ts#L117)

Validates unknown value is a [BaseIngredientId](../../../../type-aliases/BaseIngredientId.md).

## Parameters

### from

`unknown`

Value to validate

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`BaseIngredientId`](../../../../type-aliases/BaseIngredientId.md)\>

`Success` with [BaseIngredientId](../../../../type-aliases/BaseIngredientId.md) or `Failure` with an error
message if validation fails.
