[Home](../../README.md) > [LibraryRuntime](../README.md) > [ProducedConfectionBase](./ProducedConfectionBase.md) > removeFillingSlot

## ProducedConfectionBase.removeFillingSlot() method

Removes a filling slot.
Pushes current state to undo before change, clears redo.

**Signature:**

```typescript
removeFillingSlot(slotId: SlotId): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>slotId</td><td>SlotId</td><td>Slot ID to remove</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success or failure
