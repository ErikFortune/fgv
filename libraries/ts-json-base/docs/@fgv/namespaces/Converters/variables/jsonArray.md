[**@fgv/ts-json-base**](../../../../README.md)

***

[@fgv/ts-json-base](../../../../README.md) / [Converters](../README.md) / jsonArray

# Variable: jsonArray

> `const` **jsonArray**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonArray`](../../../../interfaces/JsonArray.md), [`IJsonConverterContext`](../interfaces/IJsonConverterContext.md)\>

An copying converter which converts a supplied `unknown` value to
a valid [JsonArray](../../../../interfaces/JsonArray.md). Fails by default if any properties or array elements
are `undefined` - this default behavior can be overridden by supplying an appropriate
`IJsonConverterContext` at runtime.

Guaranteed to return a new array.
