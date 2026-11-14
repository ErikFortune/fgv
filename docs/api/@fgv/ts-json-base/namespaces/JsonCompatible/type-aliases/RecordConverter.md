[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonCompatible](../README.md) / RecordConverter

# Type Alias: RecordConverter\<T, TC, TK\>

> **RecordConverter**\<`T`, `TC`, `TK`\> = [`BaseConverter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Record`\<`TK`, [`JsonCompatibleType`](../../../type-aliases/JsonCompatibleType.md)\<`T`\>\>, `TC`\>

A converter which converts a supplied `unknown` value to a valid record of [JsonCompatible](../../../type-aliases/JsonCompatibleType.md) values.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-t"></a> `T` | - |
| <a id="type-parameter-tc"></a> `TC` | `unknown` |
| <a id="type-parameter-tk"></a> `TK` *extends* `string` | `string` |
