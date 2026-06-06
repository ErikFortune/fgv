[Home](../README.md) > OptionalKeys

# Type Alias: OptionalKeys

The keys of `P` whose schemas are optional (wrapped with the `optional` modifier).

## Type

```typescript
type OptionalKeys = { [K in keyof P]: P[K] extends ISchemaValidator<infer U> ? undefined extends U ? K : never : never }[keyof P]
```
