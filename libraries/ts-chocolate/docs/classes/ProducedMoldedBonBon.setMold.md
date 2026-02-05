[Home](../README.md) > [ProducedMoldedBonBon](./ProducedMoldedBonBon.md) > setMold

## ProducedMoldedBonBon.setMold() method

Sets the mold.
Pushes current state to undo before change, clears redo.

**Signature:**

```typescript
setMold(moldId: MoldId): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>moldId</td><td>MoldId</td><td>Mold ID</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success or failure
