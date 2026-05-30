[Home](../../README.md) > [FileTree](../README.md) > AnyFileTreeDirectoryItem

# Type Alias: AnyFileTreeDirectoryItem

A directory item that may or may not be mutable at runtime.

Use this type for parameters or fields where the code checks for mutability
and handles the read-only case gracefully. Use FileTree.IMutableFileTreeDirectoryItem
when mutation is required.

Narrow with FileTree.isMutableDirectoryItem to access mutation methods.

## Type

```typescript
type AnyFileTreeDirectoryItem = IFileTreeDirectoryItem<TCT> | IMutableFileTreeDirectoryItem<TCT>
```
