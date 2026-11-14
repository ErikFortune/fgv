[Home](../../README.md) > [FileTree](../README.md) > [IMutableFileTreeFileItem](./IMutableFileTreeFileItem.md) > delete

## IMutableFileTreeFileItem.delete() method

Deletes this file from its backing store.

**Signature:**

```typescript
delete(): Result<boolean>;
```

**Returns:**

Result&lt;boolean&gt;

`Success` with `true` if the file was deleted, or `Failure` with an error message.
