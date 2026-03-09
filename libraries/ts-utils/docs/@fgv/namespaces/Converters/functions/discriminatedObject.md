[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Converters](../README.md) / discriminatedObject

# Function: discriminatedObject()

> **discriminatedObject**\<`T`, `TD`, `TC`\>(`discriminatorProp`, `converters`): [`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\>

Helper to create a [Converter](../../Conversion/interfaces/Converter.md) which converts a discriminated object without changing shape.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TD` *extends* `string` | `string` |
| `TC` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `discriminatorProp` | `string` | Name of the property used to discriminate types. |
| `converters` | [`DiscriminatedObjectConverters`](../type-aliases/DiscriminatedObjectConverters.md)\<`T`, `TD`\> | [String-keyed record of converters and validators](../type-aliases/DiscriminatedObjectConverters.md) to invoke, where each key corresponds to a value of the discriminator property. |

## Returns

[`Converter`](../../Conversion/interfaces/Converter.md)\<`T`, `TC`\>

A [Converter](../../Conversion/interfaces/Converter.md) which converts the corresponding discriminated object.

## Remarks

Takes the name of the discriminator property and a
[string-keyed Record of converters and validators](../type-aliases/DiscriminatedObjectConverters.md). During conversion,
the resulting [Converter](../../Conversion/interfaces/Converter.md) invokes the converter from `converters` that corresponds to the value of
the discriminator property in the source object.

If the source is not an object, the discriminator property is missing, or the discriminator has
a value not present in the converters, conversion fails and returns [Failure](../../../../classes/Failure.md) with more information.
