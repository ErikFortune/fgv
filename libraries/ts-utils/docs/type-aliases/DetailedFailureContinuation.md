[Home](../README.md) > DetailedFailureContinuation

# Type Alias: DetailedFailureContinuation

Callback to be called when a DetailedResult | DetailedResult encounters a failure.

## Type

```typescript
type DetailedFailureContinuation = (message: string, detail?: TD) => DetailedResult<T, TD>
```
