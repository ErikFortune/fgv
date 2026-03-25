[Home](../README.md) > ResultValueType

# Type Alias: ResultValueType

Type inference to determine the result type of an Result.

## Type

```typescript
type ResultValueType = T extends Result<infer TV> ? TV : never
```
