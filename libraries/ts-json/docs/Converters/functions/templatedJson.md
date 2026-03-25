[Home](../../README.md) > [Converters](../README.md) > templatedJson

# Function: templatedJson

Helper function which creates a new JsonConverter | JsonConverter which converts an
`unknown` value to JSON, rendering any property names or string values using mustache with
the supplied context.  See the mustache documentation for details of mustache syntax and view.

## Signature

```typescript
function templatedJson(options: Partial<TemplatedJsonConverterOptions>): JsonConverter
```
