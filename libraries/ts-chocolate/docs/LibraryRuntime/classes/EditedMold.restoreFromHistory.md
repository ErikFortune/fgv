[Home](../../README.md) > [LibraryRuntime](../README.md) > [EditedMold](./EditedMold.md) > restoreFromHistory

## EditedMold.restoreFromHistory() method

Factory method for restoring an EditedMold from serialized history.
Restores the complete editing state including undo/redo stacks.

**Signature:**

```typescript
static restoreFromHistory(history: ISerializedEditingHistoryEntity<IMoldEntity>): Result<EditedMold>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>history</td><td>ISerializedEditingHistoryEntity&lt;IMoldEntity&gt;</td><td>Serialized editing history</td></tr>
</tbody></table>

**Returns:**

Result&lt;[EditedMold](../../classes/EditedMold.md)&gt;

Result containing EditedMold or error
