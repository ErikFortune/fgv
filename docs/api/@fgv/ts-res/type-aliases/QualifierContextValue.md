[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res](../README.md) / QualifierContextValue

# Type Alias: QualifierContextValue

> **QualifierContextValue** = [`Brand`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`, `"QualifierContextValue"`\>

Branded type for a validated qualifier context value - i.e. a value
that has been determined to be valid for use in some runtime context.

## Example

```ts
For a language qualifier type, it is likely that a single language
tag can be used for either a condition or a context value. However,
a list of languages would likely only be valid as a context value.
@public
```
