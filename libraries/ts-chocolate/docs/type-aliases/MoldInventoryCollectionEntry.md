[Home](../README.md) > MoldInventoryCollectionEntry

# Type Alias: MoldInventoryCollectionEntry

A single entry in a mold inventory collection.
Keyed by the inventory entry's base ID (not the mold's ID).
The entry's `moldId` field contains the composite MoldId of the mold being inventoried.

## Type

```typescript
type MoldInventoryCollectionEntry = SubLibraryCollectionEntry<MoldInventoryEntryBaseId, IMoldInventoryEntryEntity>
```
