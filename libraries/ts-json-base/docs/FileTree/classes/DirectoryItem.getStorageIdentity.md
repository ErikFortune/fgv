[Home](../../README.md) > [FileTree](../README.md) > [DirectoryItem](./DirectoryItem.md) > getStorageIdentity

## DirectoryItem.getStorageIdentity() method

Says what storage this directory names, so a consumer can tell whether two
directory items reach the same place. Optional: an item that cannot say
leaves it absent. See FileTree.IFileTreeStorageIdentity.

**Signature:**

```typescript
getStorageIdentity(): IFileTreeStorageIdentity<TCT>;
```

**Returns:**

[IFileTreeStorageIdentity](../../interfaces/IFileTreeStorageIdentity.md)&lt;TCT&gt;
