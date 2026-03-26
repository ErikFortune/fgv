[Home](../README.md) > [AggregatedResultMapBase](./AggregatedResultMapBase.md) > collections

## AggregatedResultMapBase.collections property

Provides read-only access to the underlying collections map.
Use `collections.has(id)` and `collections.get(id)` to check existence and retrieve collections.

**Signature:**

```typescript
readonly collections: IReadOnlyValidatingResultMap<TCOLLECTIONID, AggregatedResultMapEntry<TCOLLECTIONID, TITEMID, TITEM, TMETADATA>>;
```
