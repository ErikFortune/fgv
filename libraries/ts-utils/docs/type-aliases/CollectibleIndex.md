[Home](../README.md) > CollectibleIndex

# Type Alias: CollectibleIndex

Infer the index type from an Collections.ICollectible | ICollectible type.

## Type

```typescript
type CollectibleIndex = TITEM extends ICollectible<any, infer TINDEX> ? TINDEX : never
```
