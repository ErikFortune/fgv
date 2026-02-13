[**@fgv/ts-json-base**](../../../../../../README.md)

***

[@fgv/ts-json-base](../../../../../../README.md) / [JsonCompatible](../../../README.md) / [Converters](../README.md) / discriminatedObject

# Function: discriminatedObject()

> **discriminatedObject**\<`T`, `TD`, `TC`\>(`discriminatorProp`, `converters`): [`Converter`](../../../type-aliases/Converter.md)\<`T`, `TC`\>

A helper function to create a [JSON-compatible Converter\<T, TC\>](../../../type-aliases/Converter.md) which converts a
supplied `unknown` value to a valid [JsonCompatibleType\<T\>](../../../../../../type-aliases/JsonCompatibleType.md) value.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TD` *extends* `string` | `string` |
| `TC` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `discriminatorProp` | `string` | The name of the property used to discriminate types. |
| `converters` | [`Converters.DiscriminatedObjectConverters`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonCompatibleType`](../../../../../../type-aliases/JsonCompatibleType.md)\<`T`\>, `TD`, `TC`\> | The converters to use for the conversion. |

## Returns

[`Converter`](../../../type-aliases/Converter.md)\<`T`, `TC`\>

A [JSON-compatible Converter\<T, TC\>](../../../type-aliases/Converter.md) which
converts a supplied `unknown` value to a valid [JsonCompatibleType\<T\>](../../../../../../type-aliases/JsonCompatibleType.md) value.
