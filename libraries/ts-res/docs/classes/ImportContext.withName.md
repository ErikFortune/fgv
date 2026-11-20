[Home](../README.md) > [ImportContext](./ImportContext.md) > withName

## ImportContext.withName() method

Appends names to the base ID of the import context.

**Signature:**

```typescript
withName(names: string[]): Result<ImportContext>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>names</td><td>string[]</td><td>The name segments to append to the base ID.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ImportContext](ImportContext.md)&gt;

`Success` with a new Import.ImportContext | import context containing the new base ID
if successful, or `Failure` with an error message if the operation fails.
