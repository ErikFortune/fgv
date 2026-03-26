[Home](../README.md) > [ImportContext](./ImportContext.md) > create

## ImportContext.create() method

Factory method to create a new Import.ImportContext | import context.

**Signature:**

```typescript
static create(context?: IImportContext): Result<ImportContext>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>IImportContext</td><td>The Import.IImportContext | import context to create
the new context from.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ImportContext](ImportContext.md)&gt;

`Success` with the new Import.ImportContext | import context
if successful, or `Failure` with an error message if creation fails.
