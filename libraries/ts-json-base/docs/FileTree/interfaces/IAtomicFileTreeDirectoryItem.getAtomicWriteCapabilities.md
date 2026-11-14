[Home](../../README.md) > [FileTree](../README.md) > [IAtomicFileTreeDirectoryItem](./IAtomicFileTreeDirectoryItem.md) > getAtomicWriteCapabilities

## IAtomicFileTreeDirectoryItem.getAtomicWriteCapabilities() method

Reports what atomic replacement this directory's backing store can
offer.

**Signature:**

```typescript
getAtomicWriteCapabilities(): Result<IAtomicWriteCapabilities>;
```

**Returns:**

Result&lt;[IAtomicWriteCapabilities](../../interfaces/IAtomicWriteCapabilities.md)&gt;

`Success` with the store's FileTree.IAtomicWriteCapabilities | capabilities — a non-capable store answers `atomicReplace: false`
rather than failing the inquiry. This directory's own `absolutePath` is
known to exist, so no accessor shipped today fails this call for a
`DirectoryItem`; a hypothetical accessor whose directory-existence check
could race with deletion is not precluded from returning `Failure`.
