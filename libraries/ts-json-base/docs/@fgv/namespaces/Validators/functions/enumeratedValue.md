[**@fgv/ts-json-base**](../../../../README.md)

***

[@fgv/ts-json-base](../../../../README.md) / [Validators](../README.md) / enumeratedValue

# Function: enumeratedValue()

> **enumeratedValue**\<`T`\>(`values`, `message?`): [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`IJsonValidatorContext`](../interfaces/IJsonValidatorContext.md) \| readonly `T`[]\>

Helper function to create a `Validator` which validates `unknown` to one of a set of
supplied enumerated values. Anything else fails.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `values` | readonly `T`[] | Array of allowed values. |
| `message?` | `string` | Optional custom failure message. |

## Returns

[`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`IJsonValidatorContext`](../interfaces/IJsonValidatorContext.md) \| readonly `T`[]\>

A new `Validator` returning `<T>`.

## Remarks

This JSON variant accepts an `IJsonValidatorContext` OR
a `ReadonlyArray<T>` as its validation context. If the context is an array, it is used to override the
allowed values for that validation; otherwise, the original `values` supplied at creation time are used.
