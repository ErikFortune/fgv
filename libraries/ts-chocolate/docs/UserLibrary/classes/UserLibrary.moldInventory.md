[Home](../../README.md) > [UserLibrary](../README.md) > [UserLibrary](./UserLibrary.md) > moldInventory

## UserLibrary.moldInventory property

A materialized library of mold inventory entries, keyed by composite ID.
Inventory entries are materialized lazily on access and cached.

**Signature:**

```typescript
readonly moldInventory: MaterializedLibrary<MoldInventoryEntryId, IMoldInventoryEntryEntity, IMoldInventoryEntry, never>;
```
