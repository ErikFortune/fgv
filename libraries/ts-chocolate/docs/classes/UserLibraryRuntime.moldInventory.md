[Home](../README.md) > [UserLibraryRuntime](./UserLibraryRuntime.md) > moldInventory

## UserLibraryRuntime.moldInventory property

A materialized library of mold inventory entries, keyed by composite ID.
Inventory entries are materialized lazily on access and cached.

**Signature:**

```typescript
readonly moldInventory: MaterializedLibrary<MoldInventoryEntryId, IMoldInventoryEntryEntity, IMoldInventoryEntry, never>;
```
