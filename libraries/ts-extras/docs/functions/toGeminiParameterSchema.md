[Home](../README.md) > toGeminiParameterSchema

# Function: toGeminiParameterSchema

Sanitizes a draft-07 JSON Schema (as emitted by `JsonSchema.object(...).toJson()`)
into the OpenAPI 3.0 Schema Object subset that Gemini's `function_declarations[].parameters`
accepts.

## Signature

```typescript
function toGeminiParameterSchema(schema: JsonValue): JsonValue
```
