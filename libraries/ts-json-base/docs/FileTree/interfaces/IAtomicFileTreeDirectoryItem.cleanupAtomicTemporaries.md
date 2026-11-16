[Home](../../README.md) > [FileTree](../README.md) > [IAtomicFileTreeDirectoryItem](./IAtomicFileTreeDirectoryItem.md) > cleanupAtomicTemporaries

## IAtomicFileTreeDirectoryItem.cleanupAtomicTemporaries() method

Removes any working files this store reserves for interrupted atomic
writes from the given directory.

**Signature:**

```typescript
cleanupAtomicTemporaries(): Result<readonly string[]>;
```

**Returns:**

Result&lt;readonly string[]&gt;

`Success` with the names removed, or `Failure` naming what could
not be removed.
