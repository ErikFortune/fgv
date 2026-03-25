[Home](../README.md) > [ImportManager](./ImportManager.md) > create

## ImportManager.create() method

Factory method to create a new Import.ImportManager | ImportManager.

**Signature:**

```typescript
static create(params: IImporterCreateParams): Result<ImportManager>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IImporterCreateParams</td><td>Parameters for creating the Import.ImportManager | ImportManager.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ImportManager](ImportManager.md)&gt;

`Success` with the new Import.ImportManager | ImportManager
if successful, or `Failure` with an error message if creation fails.
