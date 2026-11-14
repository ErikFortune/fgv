[Home](../../README.md) > [Import](../README.md) > [ImportManager](./ImportManager.md) > import

## ImportManager.import() method

Imports resources from an Import.IImportable | importable object.

**Signature:**

```typescript
import(importable: IImportable): Result<ImportManager>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>importable</td><td>IImportable</td><td>The Import.IImportable | importable object to import.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ImportManager](../../classes/ImportManager.md)&gt;

`Success` with the Import.ImportManager | ImportManager if successful,
or `Failure` with an error message if the import fails.
