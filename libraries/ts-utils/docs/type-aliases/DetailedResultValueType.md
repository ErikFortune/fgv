[Home](../README.md) > DetailedResultValueType

# Type Alias: DetailedResultValueType

Type inference to determine the result type `T` of a DetailedResult | DetailedResult<T, TD>.

## Type

```typescript
type DetailedResultValueType = T extends DetailedResult<infer TV, unknown> ? TV : never
```
