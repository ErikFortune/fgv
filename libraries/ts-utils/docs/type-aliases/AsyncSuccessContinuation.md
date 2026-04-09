[Home](../README.md) > AsyncSuccessContinuation

# Type Alias: AsyncSuccessContinuation

Async continuation callback to be called in the event that a
Result is successful, returning a `Promise` of a new Result.

## Type

```typescript
type AsyncSuccessContinuation = (value: T) => Promise<Result<TN>>
```
