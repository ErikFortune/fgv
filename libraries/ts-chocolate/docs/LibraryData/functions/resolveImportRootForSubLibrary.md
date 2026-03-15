[Home](../../README.md) > [LibraryData](../README.md) > resolveImportRootForSubLibrary

# Function: resolveImportRootForSubLibrary

Resolves a directory that can be treated as a library root for a specific sub-library.

The returned directory is guaranteed (if successful) to contain a navigable `data/<subLibraryId>`
directory, even if the input is shaped as `<subLibraryId>/...`, `data/...`, or a set of loose
collection files.

This is intended to unify import behavior across zip, filesystem, and in-memory sources.

## Signature

```typescript
function resolveImportRootForSubLibrary(root: IFileTreeDirectoryItem, subLibraryId: SubLibraryId, options: IResolveImportRootOptions): Result<IResolvedImportRoot>
```
