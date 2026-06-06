[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res](../README.md) / QualifierConditionValue

# Type Alias: QualifierConditionValue

> **QualifierConditionValue** = [`Brand`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`, `"QualifierConditionValue"`\>

Branded type for a validated qualifier condition value - i.e. a value
that has been determined to be valid for use in a condition attached
to some resource.

## Example

```ts
For a language qualifier type, it is likely that a single language
tag can be used for either a condition or a context value. However,
a list of languages would likely only be valid as a context value.
@public
```
