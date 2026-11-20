[Home](../README.md) > [DirectoryHandleStore](./DirectoryHandleStore.md) > getAll

## DirectoryHandleStore.getAll() method

Returns all stored handles as label/handle pairs.

**Signature:**

```typescript
getAll(): Promise<Result<{ label: string; handle: FileSystemDirectoryHandle }[]>>;
```

**Returns:**

Promise&lt;Result&lt;{ label: string; handle: [FileSystemDirectoryHandle](../interfaces/FileSystemDirectoryHandle.md) }[]&gt;&gt;

Success with array of entries, or Failure
