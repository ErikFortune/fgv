[Home](../README.md) > mapFailuresAsync

# Function: mapFailuresAsync

Aggregates error messages from a collection of deferred asynchronous work, running at most
IAsyncResultOptions.concurrency operations at once.

## Signature

```typescript
function mapFailuresAsync(work: Iterable<AsyncDeferredResult<T>>, options: IAsyncResultOptions): Promise<string[]>
```
