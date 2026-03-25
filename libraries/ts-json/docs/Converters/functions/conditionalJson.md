[Home](../../README.md) > [Converters](../README.md) > conditionalJson

# Function: conditionalJson

Helper function which creates a new JsonConverter | JsonConverter which converts a
supplied `unknown` to strongly-typed JSON, by first rendering any property
names or string values using mustache with the supplied context, then applying
multi-value property expansion and conditional flattening based on property names.

## Signature

```typescript
function conditionalJson(options: Partial<ConditionalJsonConverterOptions>): JsonConverter
```
