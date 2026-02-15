[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Converters](../README.md) / validateWith

# Function: validateWith()

> **validateWith**\<`T`, `TC`\>(`validator`, `description?`): [`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\>

Helper function to create  a [Converter](../../Conversion/interfaces/Converter.md) which validates that a supplied value is
of a type validated by a supplied validator function and returns it.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `validator` | (`from`) => `from is T` | A validator function to determine if the converted value is valid. |
| `description?` | `string` | A description of the validated type for use in error messages. |

## Returns

[`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\>

A new [Converter\<T, TC\>](../../Conversion/interfaces/Converter.md) which applies the supplied validation.

## Remarks

If `validator` succeeds, this [Converter](../../Conversion/interfaces/Converter.md) returns [Success](../../../../classes/Success.md) with the supplied
value of `from` coerced to type `<T>`.  Returns a [Failure](../../../../classes/Failure.md) with additional
information otherwise.
