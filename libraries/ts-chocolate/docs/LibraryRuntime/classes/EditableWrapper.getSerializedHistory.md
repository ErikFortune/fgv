[Home](../../README.md) > [LibraryRuntime](../README.md) > [EditableWrapper](./EditableWrapper.md) > getSerializedHistory

## EditableWrapper.getSerializedHistory() method

Serializes the complete editing history for persistence.
Includes current state, original state, and undo/redo stacks.

**Signature:**

```typescript
getSerializedHistory(original: T): ISerializedEditingHistoryEntity<T>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>original</td><td>T</td><td>Original state when editing started (for change detection on restore)</td></tr>
</tbody></table>

**Returns:**

[ISerializedEditingHistoryEntity](../../interfaces/ISerializedEditingHistoryEntity.md)&lt;T&gt;

Serialized editing history
