[Home](../README.md) > [ImportManager](./ImportManager.md) > importFromFileSystem

## ImportManager.importFromFileSystem() method

Imports resources from a file system path.

**Signature:**

```typescript
importFromFileSystem(filePath: string): Result<ImportManager>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>filePath</td><td>string</td><td>The path to import resources from.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ImportManager](ImportManager.md)&gt;

`Success` with the Import.ImportManager | ImportManager if successful,
or `Failure` with an error message if the import fails.
