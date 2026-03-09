[**@fgv/ts-json-base**](../../../../../../README.md)

***

[@fgv/ts-json-base](../../../../../../README.md) / [JsonCompatible](../../../README.md) / [Converters](../README.md) / recordOf

# Function: recordOf()

> **recordOf**\<`T`, `TC`, `TK`\>(`converter`, `options?`): [`RecordConverter`](../../../type-aliases/RecordConverter.md)\<`T`, `TC`, `TK`\>

A helper function to create a [JSON-compatible RecordConverter\<T, TC, TK\>](../../../type-aliases/RecordConverter.md)
which converts the `string`-keyed properties using a supplied [JSON-compatible Converter\<T, TC\>](../../../type-aliases/Converter.md) or
[JSON-compatible Validator\<T\>](../../../type-aliases/Validator.md) to produce a
`Record<TK, JsonCompatibleType<T>>`.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |
| `TK` *extends* `string` | `string` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `converter` | [`Converter`](../../../type-aliases/Converter.md)\<`T`, `TC`\> \| [`Validator`](../../../type-aliases/Validator.md)\<`T`, `TC`\> | [JSON-compatible Converter\<T, TC\>](../../../type-aliases/Converter.md) or [JSON-compatible Validator\<T\>](../../../type-aliases/Validator.md) used for each item in the source object. |
| `options?` | [`KeyedConverterOptions`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TC`\> | Optional `Converters.KeyedConverterOptions<TK, TC>` which supplies a key converter and/or error-handling options. |

## Returns

[`RecordConverter`](../../../type-aliases/RecordConverter.md)\<`T`, `TC`, `TK`\>

A [JSON-compatible RecordConverter\<T, TC, TK\>](../../../type-aliases/RecordConverter.md) which
converts a supplied `unknown` value to a valid record of [JsonCompatible](../../../../../../type-aliases/JsonCompatibleType.md) values.

## Remarks

If present, the supplied `Converters.KeyedConverterOptions` can provide a strongly-typed
converter for keys and/or control the handling of elements that fail conversion.
