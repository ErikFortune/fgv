[Home](../README.md) > [ProducedFilling](./ProducedFilling.md) > getSerializedHistory

## ProducedFilling.getSerializedHistory() method

Serializes the complete editing history for persistence.
Includes current state, original state, and undo/redo stacks.

**Signature:**

```typescript
getSerializedHistory(original: IProducedFillingEntity): ISerializedEditingHistoryEntity<IProducedFillingEntity>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>original</td><td>IProducedFillingEntity</td><td>Original state when editing started (for change detection on restore)</td></tr>
</tbody></table>

**Returns:**

[ISerializedEditingHistoryEntity](../interfaces/ISerializedEditingHistoryEntity.md)&lt;[IProducedFillingEntity](../interfaces/IProducedFillingEntity.md)&gt;

Serialized editing history
