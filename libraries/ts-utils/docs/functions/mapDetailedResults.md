[Home](../README.md) > mapDetailedResults

# Function: mapDetailedResults

Aggregates successful results from a collection of DetailedResult | DetailedResult<T, TD>,
optionally ignoring certain error details.

## Signature

```typescript
function mapDetailedResults(results: Iterable<DetailedResult<T, TD>>, ignore: TD[], aggregatedErrors: IMessageAggregator): Result<T[]>
```
