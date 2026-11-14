[Home](../../README.md) > [JsonSchema](../README.md) > Static

# Type Alias: Static

Recover the derived static type `T` from a schema value.

## Type

```typescript
type Static = S extends ISchemaValidator<infer T> ? T : never
```
