[Home](../README.md) > AsyncFailureContinuation

# Type Alias: AsyncFailureContinuation

Async continuation callback to be called in the event that a
Result fails, returning a `PromiseLike` of a new Result.

## Type

```typescript
type AsyncFailureContinuation = (message: string) => PromiseLike<Result<T>>
```
