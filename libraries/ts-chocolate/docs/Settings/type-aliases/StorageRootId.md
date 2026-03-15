[Home](../../README.md) > [Settings](../README.md) > StorageRootId

# Type Alias: StorageRootId

Branded string identifying a storage root.
Prefix conventions: 'builtin', 'local:<label>', 'external:<name>'

## Type

```typescript
type StorageRootId = string & { __brand: "StorageRootId" }
```
