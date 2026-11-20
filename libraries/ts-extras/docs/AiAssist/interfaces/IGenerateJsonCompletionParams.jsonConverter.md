[Home](../../README.md) > [AiAssist](../README.md) > [IGenerateJsonCompletionParams](./IGenerateJsonCompletionParams.md) > jsonConverter

## IGenerateJsonCompletionParams.jsonConverter property

Full string-to-`T` pipeline override. When supplied, takes precedence over
AiAssist.IGenerateJsonCompletionParams.converter and lets the
caller plug in a custom extractor or skip the default fence tolerance
entirely.

**Signature:**

```typescript
readonly jsonConverter: Converter<T, unknown>;
```
