[**@fgv/ts-json-base**](../../../../../../README.md)

***

[@fgv/ts-json-base](../../../../../../README.md) / [JsonCompatible](../../../README.md) / [Converters](../README.md) / arrayOf

# Function: arrayOf()

> **arrayOf**\<`T`, `TC`\>(`converter`, `onError`): [`ArrayConverter`](../../../type-aliases/ArrayConverter.md)\<`T`, `TC`\>

A helper function to create a [JSON-compatible ArrayConverter\<T, TC\>](../../../type-aliases/ArrayConverter.md)
which converts a supplied `unknown` value to a valid array of [JsonCompatibleType\<T\>](../../../../../../type-aliases/JsonCompatibleType.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `converter` | [`Converter`](../../../type-aliases/Converter.md)\<`T`, `TC`\> \| [`Validator`](../../../type-aliases/Validator.md)\<`T`, `TC`\> | `undefined` | [JSON-compatible Converter\<T, TC\>](../../../type-aliases/Converter.md) or [JSON-compatible Validator\<T\>](../../../type-aliases/Validator.md) used for each item in the source array. |
| `onError` | [`OnError`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | `'failOnError'` | The error handling option to use for the conversion. |

## Returns

[`ArrayConverter`](../../../type-aliases/ArrayConverter.md)\<`T`, `TC`\>

A [JSON-compatible ArrayConverter\<T, TC\>](../../../type-aliases/ArrayConverter.md) which returns `JsonCompatibleType<T>[]`.
