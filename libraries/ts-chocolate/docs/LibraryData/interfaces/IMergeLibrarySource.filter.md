[Home](../../README.md) > [LibraryData](../README.md) > [IMergeLibrarySource](./IMergeLibrarySource.md) > filter

## IMergeLibrarySource.filter property

Controls which collections to merge from this library.

- `true` (default): Merge all collections.
- `false`: Merge no collections (skip this library).
- `TCollectionId[]`: Merge only the specified collections by name.
- `ILibraryLoadParams`: Fine-grained control using include/exclude patterns.

**Signature:**

```typescript
readonly filter: LibraryLoadSpec<TCollectionId>;
```
