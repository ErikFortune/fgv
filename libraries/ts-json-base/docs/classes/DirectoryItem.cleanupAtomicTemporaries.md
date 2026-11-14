[Home](../README.md) > [DirectoryItem](./DirectoryItem.md) > cleanupAtomicTemporaries

## DirectoryItem.cleanupAtomicTemporaries() method

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
