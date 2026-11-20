[Home](../../README.md) > [FileTree](../README.md) > [DirectoryItem](./DirectoryItem.md) > delete

## DirectoryItem.delete() method

Deletes this directory from its backing store.
The directory must be empty or the operation will fail.

**Signature:**

```typescript
delete(): Result<boolean>;
```

**Returns:**

Result&lt;boolean&gt;

`Success` with `true` if the directory was deleted, or `Failure` with an error message.
