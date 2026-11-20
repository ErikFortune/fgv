[Home](../../README.md) > [Converters](../README.md) > jsonArray

# Variable: jsonArray

An copying converter which converts a supplied `unknown` value to
a valid JsonArray | JsonArray. Fails by default if any properties or array elements
are `undefined` - this default behavior can be overridden by supplying an appropriate
`IJsonConverterContext` at runtime.

Guaranteed to return a new array.

## Type

`Converter<JsonArray, IJsonConverterContext>`
