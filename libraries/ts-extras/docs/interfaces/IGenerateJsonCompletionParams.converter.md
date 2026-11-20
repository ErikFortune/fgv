[Home](../README.md) > [IGenerateJsonCompletionParams](./IGenerateJsonCompletionParams.md) > converter

## IGenerateJsonCompletionParams.converter property

Caller-supplied `Converter<T>` or `Validator<T>` applied to the parsed
JSON value. Wrapped internally in AiAssist.fencedStringifiedJson
unless AiAssist.IGenerateJsonCompletionParams.jsonConverter is
provided.

**Signature:**

```typescript
readonly converter: Converter<T, unknown> | Validator<T, unknown>;
```
