[**@fgv/ts-json-base**](../../../../README.md)

***

[@fgv/ts-json-base](../../../../README.md) / [Converters](../README.md) / jsonValue

# Variable: jsonValue

> `const` **jsonValue**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../../../type-aliases/JsonValue.md), [`IJsonConverterContext`](../interfaces/IJsonConverterContext.md)\>

An copying converter which converts a supplied `unknown` value to a
valid [JsonValue](../../../../type-aliases/JsonValue.md). Fails by default if any properties or array elements
are `undefined` - this default behavior can be overridden by supplying an appropriate
`IJsonConverterContext` at runtime.
