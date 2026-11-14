[Home](../README.md) > mapDetailedResultsAsync

# Function: mapDetailedResultsAsync

Aggregates successful results from a collection of deferred asynchronous work which produces
DetailedResult | DetailedResult<T, TD>, optionally ignoring certain error details and
running at most IAsyncResultOptions.concurrency operations at once.

## Signature

```typescript
function mapDetailedResultsAsync(work: Iterable<() => Promise<DetailedResult<T, TD>>>, ignore: TD[], options: IAsyncResultOptions): Promise<Result<T[]>>
```
