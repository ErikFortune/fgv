[Home](../../README.md) > [LibraryData](../README.md) > createFilterFromSpec

# Function: createFilterFromSpec

Creates a CollectionFilter from a LibraryLoadSpec.

This helper provides a consistent way to convert the various forms of
LibraryLoadSpec into a properly configured CollectionFilter.

## Signature

```typescript
function createFilterFromSpec(filterSpec: LibraryLoadSpec<TCollectionId>, nameConverter: Converter<TCollectionId, unknown> | Validator<TCollectionId, unknown>): CollectionFilter<TCollectionId>
```
