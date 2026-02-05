[Home](../README.md) > LibraryLoadSpec

# Type Alias: LibraryLoadSpec

Specifies which collections from a library should be loaded.

- `true`: Load all collections (default).
- `false`: Load no collections.
- `ReadonlyArray<TCollectionId>`: Load only the specified collections by name.
- `ILibraryLoadParams`: Fine-grained control using include/exclude patterns.

## Type

```typescript
type LibraryLoadSpec = boolean | ReadonlyArray<TCollectionId> | ILibraryLoadParams
```
