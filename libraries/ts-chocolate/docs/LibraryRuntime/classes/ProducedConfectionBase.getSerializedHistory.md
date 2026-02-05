[Home](../../README.md) > [LibraryRuntime](../README.md) > [ProducedConfectionBase](./ProducedConfectionBase.md) > getSerializedHistory

## ProducedConfectionBase.getSerializedHistory() method

Gets the serialized editing history for persistence.
Captures current state, original state, and undo/redo stacks.

**Signature:**

```typescript
getSerializedHistory(original: T): ISerializedEditingHistoryEntity<T>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>original</td><td>T</td><td>The original state when session started</td></tr>
</tbody></table>

**Returns:**

[ISerializedEditingHistoryEntity](../../interfaces/ISerializedEditingHistoryEntity.md)&lt;T&gt;

Serialized editing history
