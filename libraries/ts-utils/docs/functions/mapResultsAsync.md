[Home](../README.md) > mapResultsAsync

# Function: mapResultsAsync

Aggregates successful result values from a collection of deferred asynchronous work, running
at most IAsyncResultOptions.concurrency operations at once.

## Signature

```typescript
function mapResultsAsync(work: Iterable<AsyncDeferredResult<T>>, options: IAsyncResultOptions): Promise<Result<T[]>>
```
