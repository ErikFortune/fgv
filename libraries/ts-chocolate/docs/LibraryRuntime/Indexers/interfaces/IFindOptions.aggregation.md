[Home](../../../README.md) > [LibraryRuntime](../../README.md) > [Indexers](../README.md) > [IFindOptions](./IFindOptions.md) > aggregation

## IFindOptions.aggregation property

How to aggregate results from multiple indexers.
- 'intersection': Return only entities matching ALL indexers (AND semantics)
- 'union': Return entities matching ANY indexer (OR semantics)
Defaults to 'intersection'.

**Signature:**

```typescript
aggregation: AggregationMode;
```
