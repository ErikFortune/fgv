[Home](../README.md) > [ProducedConfectionBase](./ProducedConfectionBase.md) > setFillingSlot

## ProducedConfectionBase.setFillingSlot() method

Sets or updates a filling slot.
Pushes current state to undo before change, clears redo.

**Signature:**

```typescript
setFillingSlot(slotId: SlotId, choice: { type: "recipe"; fillingId: FillingId } | { type: "ingredient"; ingredientId: IngredientId }): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>slotId</td><td>SlotId</td><td>Slot ID</td></tr>
<tr><td>choice</td><td>{ type: "recipe"; fillingId: FillingId } | { type: "ingredient"; ingredientId: IngredientId }</td><td>Filling choice (recipe or ingredient)</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success or failure
