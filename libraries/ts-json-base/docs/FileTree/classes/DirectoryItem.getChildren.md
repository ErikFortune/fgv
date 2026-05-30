[Home](../../README.md) > [FileTree](../README.md) > [DirectoryItem](./DirectoryItem.md) > getChildren

## DirectoryItem.getChildren() method

Gets the children of the directory.

**Signature:**

```typescript
getChildren(): Result<readonly FileTreeItem<TCT>[]>;
```

**Returns:**

Result&lt;readonly [FileTreeItem](../../type-aliases/FileTreeItem.md)&lt;TCT&gt;[]&gt;

`Success` with the children of the directory if successful,
or `Failure` with an error message otherwise.
