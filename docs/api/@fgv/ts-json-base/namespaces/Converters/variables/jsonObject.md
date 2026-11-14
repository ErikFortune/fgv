[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [Converters](../README.md) / jsonObject

# Variable: jsonObject

> `const` **jsonObject**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](../../../interfaces/JsonObject.md), [`IJsonConverterContext`](../interfaces/IJsonConverterContext.md)\>

An copying converter which converts a supplied `unknown` value into
a valid [JsonObject](../../../interfaces/JsonObject.md). Fails by default if any properties or array elements
are `undefined` - this default behavior can be overridden by supplying an appropriate
`IJsonConverterContext` at runtime.

Guaranteed to return a new object whose prototype is `Object.prototype`. An own `"__proto__"`
key (as `JSON.parse` produces) is dropped rather than copied: assigning it would replace the
copy's prototype, and defining it as data would hand downstream code a key that `Object.assign`
or a spread re-interprets the same way.
