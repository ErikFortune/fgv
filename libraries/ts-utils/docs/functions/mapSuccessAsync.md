[Home](../README.md) > mapSuccessAsync

# Function: mapSuccessAsync

Aggregates successful results from a collection of deferred asynchronous work, running at most
IAsyncResultOptions.concurrency operations at once and failing only if everything
failed.

## Signature

```typescript
function mapSuccessAsync(work: Iterable<AsyncDeferredResult<T>>, options: IAsyncResultOptions): Promise<Result<T[]>>
```
