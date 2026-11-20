[Home](../../README.md) > [Import](../README.md) > [FsItem](./FsItem.md) > getContext

## FsItem.getContext() method

Gets the context for this file system item.

**Signature:**

```typescript
getContext(): Result<ImportContext>;
```

**Returns:**

Result&lt;[ImportContext](../../classes/ImportContext.md)&gt;

`Success` containing the Import.ImportContext | import context for this item
if successful, or a `Failure` containing an error message if an error occurs.
