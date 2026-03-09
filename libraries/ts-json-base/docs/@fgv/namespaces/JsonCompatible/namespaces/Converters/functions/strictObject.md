[**@fgv/ts-json-base**](../../../../../../README.md)

***

[@fgv/ts-json-base](../../../../../../README.md) / [JsonCompatible](../../../README.md) / [Converters](../README.md) / strictObject

# Function: strictObject()

> **strictObject**\<`T`, `TC`\>(`properties`, `options?`): [`ObjectConverter`](../../../type-aliases/ObjectConverter.md)\<`T`, `TC`\>

A helper function to create a [JSON-compatible ObjectConverter\<T, TC\>](../../../type-aliases/ObjectConverter.md) which converts a
supplied `unknown` value to a valid [JsonCompatibleType\<T\>](../../../../../../type-aliases/JsonCompatibleType.md) value.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `properties` | [`Conversion.FieldConverters`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonCompatibleType`](../../../../../../type-aliases/JsonCompatibleType.md)\<`T`\>, `TC`\> | The properties to convert. |
| `options?` | [`StrictObjectConverterOptions`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonCompatibleType`](../../../../../../type-aliases/JsonCompatibleType.md)\<`T`\>\> | The options to use for the conversion. |

## Returns

[`ObjectConverter`](../../../type-aliases/ObjectConverter.md)\<`T`, `TC`\>

A [JSON-compatible ObjectConverter\<T, TC\>](../../../type-aliases/ObjectConverter.md) which
converts a supplied `unknown` value to a valid [JsonCompatibleType\<T\>](../../../../../../type-aliases/JsonCompatibleType.md) value.
