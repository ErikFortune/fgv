[Home](../../README.md) > [LibraryRuntime](../README.md) > [EditedDecoration](./EditedDecoration.md) > applyUpdate

## EditedDecoration.applyUpdate() method

Applies a partial update to the current entity.
This is useful for bulk field updates.
Pushes current state to undo before change, clears redo.

**Signature:**

```typescript
applyUpdate(update: Partial<IDecorationEntity>): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>update</td><td>Partial&lt;IDecorationEntity&gt;</td><td>Partial entity fields to merge</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success
