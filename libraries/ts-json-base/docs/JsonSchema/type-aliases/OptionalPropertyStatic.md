[Home](../../README.md) > [JsonSchema](../README.md) > OptionalPropertyStatic

# Type Alias: OptionalPropertyStatic

The static value type carried by an optional property (the inner schema's static type,
without the `| undefined` that optionality adds — the `?` modifier conveys that separately).

## Type

```typescript
type OptionalPropertyStatic = V extends ISchemaValidator<infer U> ? Exclude<U, undefined> : never
```
