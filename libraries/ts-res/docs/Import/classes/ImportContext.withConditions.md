[Home](../../README.md) > [Import](../README.md) > [ImportContext](./ImportContext.md) > withConditions

## ImportContext.withConditions() method

Adds conditions to the import context.

**Signature:**

```typescript
withConditions(conditions: ILooseConditionDecl[]): Result<ImportContext>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>conditions</td><td>ILooseConditionDecl[]</td><td>Conditions to be added to the import context.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ImportContext](../../classes/ImportContext.md)&gt;

`Success` with a new Import.ImportContext | import context containing the added conditions
if successful, or `Failure` with an error message if the operation fails.
