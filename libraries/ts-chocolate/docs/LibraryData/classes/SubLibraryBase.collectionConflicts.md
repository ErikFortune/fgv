[Home](../../README.md) > [LibraryData](../README.md) > [SubLibraryBase](./SubLibraryBase.md) > collectionConflicts

## SubLibraryBase.collectionConflicts property

All collection ID collisions detected across all sources.

Each entry describes one duplicated collection ID: the active (winning) copy
and all conflicting copies that were discarded. Covers all collision types:
loaded+loaded, loaded+encrypted, and encrypted+encrypted.

Use `removeConflictingCopy` to delete a conflicting copy, or
`removeCollection` / `removeProtectedCollection` to remove the active copy.

**Signature:**

```typescript
readonly collectionConflicts: readonly ICollectionIdConflict[];
```
