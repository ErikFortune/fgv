[**@fgv/ts-json-base**](../../../../README.md)

***

[@fgv/ts-json-base](../../../../README.md) / [Converters](../README.md) / literal

# Function: literal()

> **literal**\<`T`\>(`value`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`IJsonConverterContext`](../interfaces/IJsonConverterContext.md)\>

Helper to create a converter for a literal value.
Accepts `IJsonConverterContext` but ignores it.
Mirrors the behavior of `@fgv/ts-utils`.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `T` |

## Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`IJsonConverterContext`](../interfaces/IJsonConverterContext.md)\>
