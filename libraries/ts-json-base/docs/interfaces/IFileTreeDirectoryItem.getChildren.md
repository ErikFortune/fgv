[Home](../README.md) > [IFileTreeDirectoryItem](./IFileTreeDirectoryItem.md) > getChildren

## IFileTreeDirectoryItem.getChildren() method

Gets the children of the directory.

**Signature:**

```typescript
getChildren(): Result<readonly FileTreeItem<TCT>[]>;
```

**Returns:**

Result&lt;readonly [FileTreeItem](../type-aliases/FileTreeItem.md)&lt;TCT&gt;[]&gt;

`Success` with the children of the directory if successful,
or `Failure` with an error message otherwise.
