[Home](../README.md) > SubLibraryMergeSource

# Type Alias: SubLibraryMergeSource

Specifies a sub-library to merge into a new library.

Can be either:
- A library instance directly (merges all collections)
- An `IMergeLibrarySource` object with optional filtering

## Type

```typescript
type SubLibraryMergeSource = TLibrary | IMergeLibrarySource<TLibrary, CollectionId>
```
