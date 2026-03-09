[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Converters](../README.md) / isA

# Function: isA()

> **isA**\<`T`, `TC`\>(`description`, `guard`): [`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\>

Helper function to create a [Converter](../../Conversion/interfaces/Converter.md) from a supplied type guard function.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `description` | `string` | a description of the thing to be validated for use in error messages |
| `guard` | [`TypeGuardWithContext`](../../Validation/type-aliases/TypeGuardWithContext.md)\<`T`, `TC`\> | a [Validation.TypeGuardWithContext](../../Validation/type-aliases/TypeGuardWithContext.md) which performs the validation. |

## Returns

[`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\>

A new [Converter](../../Conversion/interfaces/Converter.md) which validates the values using the supplied type guard
and returns them in place.
