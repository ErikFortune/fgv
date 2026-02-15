[Home](../README.md) > [EditedTask](./EditedTask.md) > restoreFromHistory

## EditedTask.restoreFromHistory() method

Factory method for restoring an EditedTask from serialized history.
Restores the complete editing state including undo/redo stacks.

**Signature:**

```typescript
static restoreFromHistory(history: ISerializedEditingHistoryEntity<IRawTaskEntity>): Result<EditedTask>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>history</td><td>ISerializedEditingHistoryEntity&lt;IRawTaskEntity&gt;</td><td>Serialized editing history</td></tr>
</tbody></table>

**Returns:**

Result&lt;[EditedTask](EditedTask.md)&gt;

Result containing EditedTask or error
