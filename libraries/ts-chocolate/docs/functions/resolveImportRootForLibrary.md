[Home](../README.md) > resolveImportRootForLibrary

# Function: resolveImportRootForLibrary

Resolves a directory that can be treated as a library root for any sub-libraries.

The returned directory is guaranteed (if successful) to contain a navigable `data/` directory
with at least one standard sub-library directory (ingredients, fillings, etc.).

This is intended to unify import behavior across zip, filesystem, and in-memory sources
when importing a full library rather than a specific sub-library.

## Signature

```typescript
function resolveImportRootForLibrary(root: IFileTreeDirectoryItem, options: Omit<IResolveImportRootOptions, "allowLooseFiles">): Result<IResolvedImportRoot>
```
