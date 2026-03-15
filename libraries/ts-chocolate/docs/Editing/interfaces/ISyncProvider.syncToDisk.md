[Home](../../README.md) > [Editing](../README.md) > [ISyncProvider](./ISyncProvider.md) > syncToDisk

## ISyncProvider.syncToDisk() method

Flush all dirty FileTree changes to the filesystem.

**Signature:**

```typescript
syncToDisk(): Promise<Result<true>>;
```

**Returns:**

Promise&lt;Result&lt;true&gt;&gt;

`Success<true>` if sync succeeded, `Failure` with error context otherwise
