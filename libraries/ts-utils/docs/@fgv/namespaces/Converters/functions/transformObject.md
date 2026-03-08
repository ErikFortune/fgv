[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Converters](../README.md) / transformObject

# Function: transformObject()

> **transformObject**\<`TSRC`, `TDEST`, `TC`\>(`destinationFields`, `options?`): [`Converter`](../../Conversion/interfaces/Converter.md)\<`TDEST`, `TC`\>

Helper to create a strongly-typed [Converter](../../Conversion/interfaces/Converter.md) which converts a source object to a
new object with a different shape.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TSRC` | - |
| `TDEST` | - |
| `TC` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `destinationFields` | [`FieldTransformers`](../type-aliases/FieldTransformers.md)\<`TSRC`, `TDEST`, `TC`\> | An object with key names that correspond to the target object and an appropriate [FieldTransformers](../type-aliases/FieldTransformers.md) which specifies the name of the corresponding property in the source object, the converter or validator used for each source property and any other configuration to guide the conversion. |
| `options?` | [`TransformObjectOptions`](../interfaces/TransformObjectOptions.md)\<`TSRC`\> | Options which affect the transformation. |

## Returns

[`Converter`](../../Conversion/interfaces/Converter.md)\<`TDEST`, `TC`\>

A [Converter](../../Conversion/interfaces/Converter.md) with the specified conversion behavior.

## Remarks

On successful conversion, the resulting [Converter](../../Conversion/interfaces/Converter.md) returns [Success](../../../../classes/Success.md) with a new
object, which contains the converted values under the key names specified at initialization time.

It returns [Failure](../../../../classes/Failure.md) with an error message if any fields to be extracted do not exist
or cannot be converted.
