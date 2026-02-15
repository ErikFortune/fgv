[Home](../README.md) > [EditedTask](./EditedTask.md) > getSerializedHistory

## EditedTask.getSerializedHistory() method

Serializes the complete editing history for persistence.
Includes current state, original state, and undo/redo stacks.

**Signature:**

```typescript
getSerializedHistory(original: IRawTaskEntity): ISerializedEditingHistoryEntity<IRawTaskEntity>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>original</td><td>IRawTaskEntity</td><td>Original state when editing started (for change detection on restore)</td></tr>
</tbody></table>

**Returns:**

[ISerializedEditingHistoryEntity](../interfaces/ISerializedEditingHistoryEntity.md)&lt;[IRawTaskEntity](../interfaces/IRawTaskEntity.md)&gt;

Serialized editing history
