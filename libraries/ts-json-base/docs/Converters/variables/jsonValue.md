[Home](../../README.md) > [Converters](../README.md) > jsonValue

# Variable: jsonValue

An copying converter which converts a supplied `unknown` value to a
valid JsonValue | JsonValue. Fails by default if any properties or array elements
are `undefined` - this default behavior can be overridden by supplying an appropriate
`IJsonConverterContext` at runtime.

## Type

`Converter<JsonValue, IJsonConverterContext>`
