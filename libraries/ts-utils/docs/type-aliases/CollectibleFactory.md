[Home](../README.md) > CollectibleFactory

# Type Alias: CollectibleFactory

Factory function for creating a new Collections.ICollectible | ICollectible instance given a key, an index and a source representation
of the item to be added.

## Type

```typescript
type CollectibleFactory = (key: CollectibleKey<TITEM>, index: number, item: TSRC) => Result<TITEM>
```
