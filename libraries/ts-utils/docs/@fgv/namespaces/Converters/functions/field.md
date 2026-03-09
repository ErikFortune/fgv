[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Converters](../README.md) / field

# Function: field()

> **field**\<`T`, `TC`\>(`name`, `converter`): [`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\>

A helper function to create a [Converter](../../Conversion/interfaces/Converter.md) which extracts and convert a property specified
by name from an object.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | The name of the field to be extracted. |
| `converter` | [`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\> \| [`Validator`](../../Validation/interfaces/Validator.md)\<`T`, `TC`\> | [Converter](../../Conversion/interfaces/Converter.md) or [Validator](../../Validation/interfaces/Validator.md) to use for the extracted field. |

## Returns

[`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\>

## Remarks

The resulting [Converter](../../Conversion/interfaces/Converter.md) returns [Success](../../../../classes/Success.md) with the converted value of the corresponding
object property if the field exists and can be converted. Returns [Failure](../../../../classes/Failure.md) with an error message
otherwise.
