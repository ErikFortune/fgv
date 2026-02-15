[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Converters](../README.md) / transform

# Function: transform()

> **transform**\<`T`, `TC`\>(`properties`): [`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\>

Helper to create a [Converter](../../Conversion/interfaces/Converter.md) which converts a source object to a new object with a
different shape.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `properties` | [`FieldConverters`](../../Conversion/type-aliases/FieldConverters.md)\<`T`, `TC`\> | An object with key names that correspond to the target object and an appropriate [FieldConverter](../../Conversion/type-aliases/FieldConverters.md) which extracts and converts a single filed from the source object. |

## Returns

[`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\>

A [Converter](../../Conversion/interfaces/Converter.md) with the specified conversion behavior.

## Remarks

On successful conversion, the resulting [Converter](../../Conversion/interfaces/Converter.md) returns [Success](../../../../classes/Success.md) with a new
object, which contains the converted values under the key names specified at initialization time.
It returns [Failure](../../../../classes/Failure.md) with an error message if any fields to be extracted do not exist
or cannot be converted.

Fields that succeed but convert to undefined are omitted from the result object but do not
fail the conversion.
