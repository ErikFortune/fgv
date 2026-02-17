[Home](../README.md) > [EditedFillingRecipe](./EditedFillingRecipe.md) > restoreFromHistory

## EditedFillingRecipe.restoreFromHistory() method

Factory method for restoring an EditedFillingRecipe from serialized history.
Restores the complete editing state including undo/redo stacks.

**Signature:**

```typescript
static restoreFromHistory(history: ISerializedEditingHistoryEntity<IFillingRecipeEntity>): Result<EditedFillingRecipe>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>history</td><td>ISerializedEditingHistoryEntity&lt;IFillingRecipeEntity&gt;</td><td>Serialized editing history</td></tr>
</tbody></table>

**Returns:**

Result&lt;[EditedFillingRecipe](EditedFillingRecipe.md)&gt;

Result containing EditedFillingRecipe or error
