[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Converters](../README.md) / optionalElement

# Function: optionalElement()

> **optionalElement**\<`T`, `TC`\>(`index`, `converter`): [`Converter`](../../Conversion/interfaces/Converter.md)\<`T` \| `undefined`, `TC`\>

A helper function to create a [Converter](../../Conversion/interfaces/Converter.md) which extracts and converts an optional element from an array.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `index` | `number` | The index of the element to be extracted. |
| `converter` | [`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\> \| [`Validator`](../../Validation/interfaces/Validator.md)\<`T`, `TC`\> | A [Converter](../../Conversion/interfaces/Converter.md) or [Validator](../../Validation/interfaces/Validator.md) used for the extracted element. |

## Returns

[`Converter`](../../Conversion/interfaces/Converter.md)\<`T` \| `undefined`, `TC`\>

A [Converter\<T, TC\>](../../Conversion/interfaces/Converter.md) which extracts the specified element from an array.

## Remarks

The resulting [Converter](../../Conversion/interfaces/Converter.md) returns [Success](../../../../classes/Success.md) with the converted value if the element exists
in the supplied array and can be converted. Returns [Success](../../../../classes/Success.md) with value `undefined` if the parameter
is an array but the index is out of range. Returns [Failure](../../../../classes/Failure.md) with a message if the supplied parameter
is not an array, if the requested index is negative, or if the element cannot be converted.
