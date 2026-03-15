[Home](../../README.md) > [LibraryData](../README.md) > [IFileTreeSource](./IFileTreeSource.md) > load

## IFileTreeSource.load property

Controls which collections to load from this source.

- `true` (default): Load all collections.
- `false`: Load no collections.
- `TCollectionId[]`: Load only the specified collections by name.
- `ILibraryLoadParams`: Fine-grained control using include/exclude patterns.

**Signature:**

```typescript
readonly load: LibraryLoadSpec<TCollectionId>;
```
