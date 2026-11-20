[Home](../README.md) > [ImportContext](./ImportContext.md) > forContainerImport

## ImportContext.forContainerImport() method

Creates a new Import.ImportContext | import context to import resources from a
container with the specified ResourceJson.Normalized.IContainerContextDecl | container context declaratione

**Signature:**

```typescript
static forContainerImport(container?: IContainerContextDecl, importer?: ImportContext): Result<ImportContext | undefined>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>container</td><td>IContainerContextDecl</td><td>The ResourceJson.Normalized.IContainerContextDecl | container context declaration
to consider when creating the new context.</td></tr>
<tr><td>importer</td><td>ImportContext</td><td>The base Import.ImportContext | import context to adjust for the container
context.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ImportContext](ImportContext.md) | undefined&gt;

`Success` with the new Import.ImportContext | import context if successful,
or `Failure` with an error message if the operation fails.
