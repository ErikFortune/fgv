[Home](../../README.md) > [Collections](../README.md) > CollectibleKey

# Type Alias: CollectibleKey

Infer the key type from an Collections.ICollectible | ICollectible type.

## Type

```typescript
type CollectibleKey = TITEM extends ICollectible<infer TKEY> ? TKEY : never
```
