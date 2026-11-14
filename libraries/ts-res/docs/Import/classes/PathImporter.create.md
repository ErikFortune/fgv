[Home](../../README.md) > [Import](../README.md) > [PathImporter](./PathImporter.md) > create

## PathImporter.create() method

Creates a new Import.Importers.PathImporter | PathImporter.

**Signature:**

```typescript
static create(params: IPathImporterCreateParams): Result<PathImporter>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IPathImporterCreateParams</td><td>Parameters for creating the Import.Importers.PathImporter | dirPathImporter.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[PathImporter](../../classes/PathImporter.md)&gt;

`Success` with the new `PathImporter` if successful, `Failure` with an error message if not.
