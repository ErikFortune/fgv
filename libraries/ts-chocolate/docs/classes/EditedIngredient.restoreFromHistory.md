[Home](../README.md) > [EditedIngredient](./EditedIngredient.md) > restoreFromHistory

## EditedIngredient.restoreFromHistory() method

Factory method for restoring an EditedIngredient from serialized history.
Restores the complete editing state including undo/redo stacks.

**Signature:**

```typescript
static restoreFromHistory(history: ISerializedEditingHistoryEntity<IngredientEntity>): Result<EditedIngredient>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>history</td><td>ISerializedEditingHistoryEntity&lt;IngredientEntity&gt;</td><td>Serialized editing history</td></tr>
</tbody></table>

**Returns:**

Result&lt;[EditedIngredient](EditedIngredient.md)&gt;

Result containing EditedIngredient or error
