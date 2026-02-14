[Home](../README.md) > [EditedIngredient](./EditedIngredient.md) > getSerializedHistory

## EditedIngredient.getSerializedHistory() method

Serializes the complete editing history for persistence.
Includes current state, original state, and undo/redo stacks.

**Signature:**

```typescript
getSerializedHistory(original: IngredientEntity): ISerializedEditingHistoryEntity<IngredientEntity>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>original</td><td>IngredientEntity</td><td>Original state when editing started (for change detection on restore)</td></tr>
</tbody></table>

**Returns:**

[ISerializedEditingHistoryEntity](../interfaces/ISerializedEditingHistoryEntity.md)&lt;[IngredientEntity](../type-aliases/IngredientEntity.md)&gt;

Serialized editing history
