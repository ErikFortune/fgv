[Home](../README.md) > AnyFileTreeFileItem

# Type Alias: AnyFileTreeFileItem

A file item that may or may not be mutable at runtime.

Use this type for parameters or fields where the code checks for mutability
and handles the read-only case gracefully. Use FileTree.IMutableFileTreeFileItem
when mutation is required.

Narrow with FileTree.isMutableFileItem to access mutation methods.

## Type

```typescript
type AnyFileTreeFileItem = IFileTreeFileItem<TCT> | IMutableFileTreeFileItem<TCT>
```
