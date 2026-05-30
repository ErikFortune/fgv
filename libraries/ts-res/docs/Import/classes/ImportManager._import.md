[Home](../../README.md) > [Import](../README.md) > [ImportManager](./ImportManager.md) > _import

## ImportManager._import() method

Imports any items on the import stack.

**Signature:**

```typescript
_import(): Result<ImportManager>;
```

**Returns:**

Result&lt;[ImportManager](../../classes/ImportManager.md)&gt;

`Success` with the Import.ImportManager | ImportManager if successful,
or `Failure` with an error message if the import fails.
