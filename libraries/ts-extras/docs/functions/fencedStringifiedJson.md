[Home](../README.md) > fencedStringifiedJson

# Function: fencedStringifiedJson

Creates a `Converter` that accepts raw LLM response text, runs it through a
tolerant extractor (default: AiAssist.extractJsonText), parses the
extracted substring as JSON, and applies an optional inner converter or
validator.

## Signature

```typescript
function fencedStringifiedJson(options: IFencedStringifiedJsonExtractorOptions): Converter<JsonValue>
```
