[Home](../../README.md) > [Import](../README.md) > [ImportContext](./ImportContext.md) > extend

## ImportContext.extend() method

Extends the import context with additional name segments and conditions.

**Signature:**

```typescript
extend(context?: IValidatedImportContext): Result<ImportContext>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>IValidatedImportContext</td><td>The Import.IImportContext | import context to extend this context with.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ImportContext](../../classes/ImportContext.md)&gt;

`Success` with a new Import.ImportContext | import context
containing the extended context if successful, or `Failure` with an error
message if the operation fails.
