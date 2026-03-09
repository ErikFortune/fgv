[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Validators](../README.md) / literal

# Function: literal()

> **literal**\<`T`\>(`value`): [`Validator`](../../Validation/interfaces/Validator.md)\<`T`\>

Helper function to create a [Validation.Validator](../../Validation/interfaces/Validator.md) which validates a literal value.

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* `string` \| `number` \| `boolean` \| `symbol` \| `null` \| `undefined` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `T` | the literal value to be validated |

## Returns

[`Validator`](../../Validation/interfaces/Validator.md)\<`T`\>
