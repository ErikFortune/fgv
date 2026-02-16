[Home](../../README.md) > [LibraryRuntime](../README.md) > [EditedDecoration](./EditedDecoration.md) > getSerializedHistory

## EditedDecoration.getSerializedHistory() method

Serializes the complete editing history for persistence.
Includes current state, original state, and undo/redo stacks.

**Signature:**

```typescript
getSerializedHistory(original: IDecorationEntity): ISerializedEditingHistoryEntity<IDecorationEntity>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>original</td><td>IDecorationEntity</td><td>Original state when editing started (for change detection on restore)</td></tr>
</tbody></table>

**Returns:**

[ISerializedEditingHistoryEntity](../../interfaces/ISerializedEditingHistoryEntity.md)&lt;[IDecorationEntity](../../interfaces/IDecorationEntity.md)&gt;

Serialized editing history
