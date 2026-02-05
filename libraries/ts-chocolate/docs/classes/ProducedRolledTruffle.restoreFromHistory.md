[Home](../README.md) > [ProducedRolledTruffle](./ProducedRolledTruffle.md) > restoreFromHistory

## ProducedRolledTruffle.restoreFromHistory() method

Restores a ProducedRolledTruffle from serialized editing history.

**Signature:**

```typescript
static restoreFromHistory(history: ISerializedEditingHistoryEntity<IProducedRolledTruffleEntity>): Result<ProducedRolledTruffle>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>history</td><td>ISerializedEditingHistoryEntity&lt;IProducedRolledTruffleEntity&gt;</td><td>Serialized editing history</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ProducedRolledTruffle](ProducedRolledTruffle.md)&gt;

Result containing ProducedRolledTruffle or error
