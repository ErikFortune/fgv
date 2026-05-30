[Home](../../README.md) > [Converters](../README.md) > jsonObject

# Variable: jsonObject

An copying converter which converts a supplied `unknown` value into
a valid JsonObject | JsonObject. Fails by default if any properties or array elements
are `undefined` - this default behavior can be overridden by supplying an appropriate
`IJsonConverterContext` at runtime.

Guaranteed to return a new object.

## Type

`Converter<JsonObject, IJsonConverterContext>`
