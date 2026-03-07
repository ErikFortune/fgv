[Home](../../../README.md) > [UserLibrary](../../README.md) > [Session](../README.md) > [ConfectionEditingSessionBase](./ConfectionEditingSessionBase.md) > setFillingSlot

## ConfectionEditingSessionBase.setFillingSlot() method

Sets or updates a filling slot.
Creates/updates filling session if recipe slot.

**Signature:**

```typescript
setFillingSlot(slotId: SlotId, choice: { type: "recipe"; fillingId: FillingId } | { type: "ingredient"; ingredientId: IngredientId }): Result<IEmbeddableFillingSession | undefined>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>slotId</td><td>SlotId</td><td>The slot identifier</td></tr>
<tr><td>choice</td><td>{ type: "recipe"; fillingId: FillingId } | { type: "ingredient"; ingredientId: IngredientId }</td><td>Recipe or ingredient choice</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IEmbeddableFillingSession](../../../interfaces/IEmbeddableFillingSession.md) | undefined&gt;

`Success` with the new or updated filling session, or `undefined` for ingredient slots; or `Failure`
