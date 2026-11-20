[Home](../README.md) > allSucceedAsync

# Function: allSucceedAsync

Determines whether a collection of deferred asynchronous work all succeeded, running at most
IAsyncResultOptions.concurrency operations at once.

## Signature

```typescript
function allSucceedAsync(work: Iterable<AsyncDeferredResult<unknown>>, successValue: T, options: IAsyncResultOptions): Promise<Result<T>>
```
