[Home](../../README.md) > [LibraryRuntime](../README.md) > [EditedDecoration](./EditedDecoration.md) > restoreFromHistory

## EditedDecoration.restoreFromHistory() method

Factory method for restoring an EditedDecoration from serialized history.
Restores the complete editing state including undo/redo stacks.

**Signature:**

```typescript
static restoreFromHistory(history: ISerializedEditingHistoryEntity<IDecorationEntity>): Result<EditedDecoration>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>history</td><td>ISerializedEditingHistoryEntity&lt;IDecorationEntity&gt;</td><td>Serialized editing history</td></tr>
</tbody></table>

**Returns:**

Result&lt;[EditedDecoration](../../classes/EditedDecoration.md)&gt;

Result containing EditedDecoration or error
