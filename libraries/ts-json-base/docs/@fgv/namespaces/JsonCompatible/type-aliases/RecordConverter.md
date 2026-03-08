[**@fgv/ts-json-base**](../../../../README.md)

***

[@fgv/ts-json-base](../../../../README.md) / [JsonCompatible](../README.md) / RecordConverter

# Type Alias: RecordConverter\<T, TC, TK\>

> **RecordConverter**\<`T`, `TC`, `TK`\> = [`BaseConverter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Record`\<`TK`, [`JsonCompatibleType`](../../../../type-aliases/JsonCompatibleType.md)\<`T`\>\>, `TC`\>

A converter which converts a supplied `unknown` value to a valid record of [JsonCompatible](../../../../type-aliases/JsonCompatibleType.md) values.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |
| `TK` *extends* `string` | `string` |
