[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Converters](../README.md) / element

# Function: element()

> **element**\<`T`, `TC`\>(`index`, `converter`): [`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\>

A helper function to create a [Converter](../../Conversion/interfaces/Converter.md) which extracts and converts an element from an array.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `index` | `number` | The index of the element to be extracted. |
| `converter` | [`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\> \| [`Validator`](../../Validation/interfaces/Validator.md)\<`T`, `TC`\> | A [Converter](../../Conversion/interfaces/Converter.md) or [Validator](../../Validation/interfaces/Validator.md) for the extracted element. |

## Returns

[`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\>

A [Converter\<T, TC\>](../../Conversion/interfaces/Converter.md) which extracts the specified element from an array.

## Remarks

The returned [Converter](../../Conversion/interfaces/Converter.md) returns [Success](../../../../classes/Success.md) with the converted value if the element exists
in the supplied array and can be converted. Returns [Failure](../../../../classes/Failure.md) with an error message otherwise.
