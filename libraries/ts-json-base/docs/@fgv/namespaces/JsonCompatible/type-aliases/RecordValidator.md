[**@fgv/ts-json-base**](../../../../README.md)

***

[@fgv/ts-json-base](../../../../README.md) / [JsonCompatible](../README.md) / RecordValidator

# Type Alias: RecordValidator\<T, TC, TK\>

> **RecordValidator**\<`T`, `TC`, `TK`\> = [`Validation.Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Record`\<`TK`, [`JsonCompatibleType`](../../../../type-aliases/JsonCompatibleType.md)\<`T`\>\>, `TC`\>

A validator which validates a record of [JsonCompatible](../../../../type-aliases/JsonCompatibleType.md) values.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |
| `TK` *extends* `string` | `string` |
