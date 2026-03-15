[Home](../README.md) > [ProducedFilling](./ProducedFilling.md) > restoreFromHistory

## ProducedFilling.restoreFromHistory() method

Factory method for restoring a ProducedFilling from serialized history.
Restores the complete editing state including undo/redo stacks.

**Signature:**

```typescript
static restoreFromHistory(history: ISerializedEditingHistoryEntity<IProducedFillingEntity>): Result<ProducedFilling>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>history</td><td>ISerializedEditingHistoryEntity&lt;IProducedFillingEntity&gt;</td><td>Serialized editing history</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ProducedFilling](ProducedFilling.md)&gt;

Result containing ProducedFilling or error
