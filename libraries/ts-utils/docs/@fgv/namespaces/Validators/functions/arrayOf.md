[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Validators](../README.md) / arrayOf

# Function: arrayOf()

> **arrayOf**\<`T`, `TC`\>(`validateElement`, `params?`): [`ArrayValidator`](../../Validation/namespaces/Classes/classes/ArrayValidator.md)\<`T`, `TC`\>

Helper function to create a [ArrayValidator](../../Validation/namespaces/Classes/classes/ArrayValidator.md) which
validates an array in place.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |
| `TC` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `validateElement` | [`Validator`](../../Validation/interfaces/Validator.md)\<`T`, `TC`\> | A [validator](../../Validation/interfaces/Validator.md) which validates each element. |
| `params?` | `Omit`\<[`ArrayValidatorConstructorParams`](../../Validation/namespaces/Classes/interfaces/ArrayValidatorConstructorParams.md)\<`T`, `TC`\>, `"validateElement"`\> | - |

## Returns

[`ArrayValidator`](../../Validation/namespaces/Classes/classes/ArrayValidator.md)\<`T`, `TC`\>

A new [ArrayValidator](../../Validation/namespaces/Classes/classes/ArrayValidator.md) which validates the desired
array in place.
