[Home](../../README.md) > [AiAssist](../README.md) > JsonTextExtractor

# Type Alias: JsonTextExtractor

A function that pulls a JSON-shaped substring out of arbitrary model text.
Implementations strip whatever wrappers the model added (fences, preamble,
trailing prose) and return the JSON-shaped substring ready for `JSON.parse`.

## Type

```typescript
type JsonTextExtractor = (text: string) => Result<string>
```
