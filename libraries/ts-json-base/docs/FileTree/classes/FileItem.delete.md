[Home](../../README.md) > [FileTree](../README.md) > [FileItem](./FileItem.md) > delete

## FileItem.delete() method

Deletes this file from its backing store.

**Signature:**

```typescript
delete(): Result<boolean>;
```

**Returns:**

Result&lt;boolean&gt;

`Success` with `true` if the file was deleted, or `Failure` with an error message.
