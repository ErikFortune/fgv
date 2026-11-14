[Home](../README.md) > firstSuccessAsync

# Function: firstSuccessAsync

Returns the first successful result from an ordered collection of deferred asynchronous work.

## Signature

```typescript
function firstSuccessAsync(work: Iterable<AsyncDeferredResult<T>>, aggregatedErrors: IMessageAggregator): Promise<Result<T>>
```
