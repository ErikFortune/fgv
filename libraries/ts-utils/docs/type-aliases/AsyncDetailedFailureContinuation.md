[Home](../README.md) > AsyncDetailedFailureContinuation

# Type Alias: AsyncDetailedFailureContinuation

Async continuation callback to be called in the event that a
DetailedResult fails, returning a `PromiseLike` of a new
DetailedResult.

## Type

```typescript
type AsyncDetailedFailureContinuation = (message: string, detail?: TD) => PromiseLike<DetailedResult<T, TD>>
```
