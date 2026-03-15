[Home](../README.md) > [EditedConfectionRecipe](./EditedConfectionRecipe.md) > restoreFromHistory

## EditedConfectionRecipe.restoreFromHistory() method

Factory method for restoring an EditedConfectionRecipe from serialized history.
Restores the complete editing state including undo/redo stacks.

**Signature:**

```typescript
static restoreFromHistory(history: ISerializedEditingHistoryEntity<AnyConfectionRecipeEntity>): Result<EditedConfectionRecipe>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>history</td><td>ISerializedEditingHistoryEntity&lt;AnyConfectionRecipeEntity&gt;</td><td>Serialized editing history</td></tr>
</tbody></table>

**Returns:**

Result&lt;[EditedConfectionRecipe](EditedConfectionRecipe.md)&gt;

Result containing EditedConfectionRecipe or error
