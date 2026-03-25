[Home](../README.md) > ResultDetailType

# Type Alias: ResultDetailType

Type inference to determine the detail type `TD` of a DetailedResult | DetailedResult<T, TD>.

## Type

```typescript
type ResultDetailType = T extends DetailedResult<unknown, infer TD> ? TD : never
```
