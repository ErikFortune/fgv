[Home](../README.md) > EnsureArrayResult

# Type Alias: EnsureArrayResult

Helper type to extract the element type and preserve readonly status.

## Type

```typescript
type EnsureArrayResult = T extends readonly (infer _U)[] ? T : T[]
```
