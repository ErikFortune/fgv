[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [Converters](../README.md) / stringifiedJson

# Function: stringifiedJson()

## Call Signature

> **stringifiedJson**(): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../../type-aliases/JsonValue.md)\>

Creates a converter that accepts a string, parses it as JSON, and optionally
applies the supplied inner converter or validator to the parsed value.

### Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../../type-aliases/JsonValue.md)\>

Converter that parses a JSON string into `T` (or `JsonValue` when
no inner step is supplied).

### Remarks

Unlike [Converters.jsonConverter](jsonConverter.md), the inner step is optional. When omitted, the
converter resolves to the parsed `JsonValue` (object, array, or primitive).
Both `Converter<T>` and `Validator<T>` are accepted because both expose
`convert(unknown): Result<T>`.

## Call Signature

> **stringifiedJson**\<`T`\>(`inner`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Creates a converter that accepts a string, parses it as JSON, and applies
the supplied inner converter or validator to the parsed value.

### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `inner` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `unknown`\> \| [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `unknown`\> | `Converter<T>` or `Validator<T>` applied to the parsed JSON. |

### Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Converter that parses a JSON string into `T`.
