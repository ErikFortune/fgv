[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Validators](../README.md) / generic

# Function: generic()

> **generic**\<`T`, `TC`\>(`validator`): [`Validator`](../../Validation/interfaces/Validator.md)\<`T`, `TC`\>

Helper function to create a [Validator](../../Validation/interfaces/Validator.md) using a
supplied [validator function](../../Validation/type-aliases/ValidatorFunc.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `validator` | [`ValidatorFunc`](../../Validation/type-aliases/ValidatorFunc.md)\<`T`, `TC`\> | A [validator function](../../Validation/type-aliases/ValidatorFunc.md) that a supplied unknown value matches some condition. |

## Returns

[`Validator`](../../Validation/interfaces/Validator.md)\<`T`, `TC`\>

A new [Validator](../../Validation/interfaces/Validator.md) which validates the desired
value using the supplied function.
