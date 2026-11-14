[Home](../README.md) > AsyncDetailedSuccessContinuation

# Type Alias: AsyncDetailedSuccessContinuation

Async continuation callback to be called in the event that a
DetailedResult is successful, returning a `PromiseLike` of a new
DetailedResult.

## Type

```typescript
type AsyncDetailedSuccessContinuation = (value: T, detail?: TD) => PromiseLike<DetailedResult<TN, TD>>
```
