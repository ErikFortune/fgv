[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / ObjectStatic

# Type Alias: ObjectStatic\<P\>

> **ObjectStatic**\<`P`\> = [`Simplify`](Simplify.md)\<`{ [K in RequiredKeys<P>]: Static<P[K]> }` & `{ [K in OptionalKeys<P>]?: OptionalPropertyStatic<P[K]> }`\>

The derived static type for an object built from properties `P`: required keys carry their
static type directly, optional keys carry theirs under a `?` modifier.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-p"></a> `P` *extends* [`ILlmProperties`](ILlmProperties.md) |
