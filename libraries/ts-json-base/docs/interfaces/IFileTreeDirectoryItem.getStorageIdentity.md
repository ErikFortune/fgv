[Home](../README.md) > [IFileTreeDirectoryItem](./IFileTreeDirectoryItem.md) > getStorageIdentity

## IFileTreeDirectoryItem.getStorageIdentity() method

Says what storage this directory names, so a consumer can tell whether two
directory items reach the same place. Optional: an item that cannot say
leaves it absent. See FileTree.IFileTreeStorageIdentity.

**Signature:**

```typescript
getStorageIdentity(): IFileTreeStorageIdentity<TCT>;
```

**Returns:**

[IFileTreeStorageIdentity](IFileTreeStorageIdentity.md)&lt;TCT&gt;
