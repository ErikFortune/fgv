[Home](../README.md) > FullLibraryLoadSpec

# Type Alias: FullLibraryLoadSpec

Controls loading for each sub-library within a library source.

- `true`: Load all sub-libraries with default settings (all collections)
- `false`: Load no sub-libraries
- `Record<SubLibraryId | 'default', LibraryLoadSpec>`: Per-sub-library control
  - Named sub-libraries get their specific spec
  - 'default' applies to unspecified sub-libraries

## Type

```typescript
type FullLibraryLoadSpec = boolean | Partial<Record<SubLibraryId | "default", LibraryLoadSpec>>
```
