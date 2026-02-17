[Home](../../README.md) > [LibraryRuntime](../README.md) > [EditedFillingRecipe](./EditedFillingRecipe.md) > getSerializedHistory

## EditedFillingRecipe.getSerializedHistory() method

Serializes the complete editing history for persistence.

**Signature:**

```typescript
getSerializedHistory(original: IFillingRecipeEntity): ISerializedEditingHistoryEntity<IFillingRecipeEntity>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>original</td><td>IFillingRecipeEntity</td><td>Original state when editing started (for change detection on restore)</td></tr>
</tbody></table>

**Returns:**

[ISerializedEditingHistoryEntity](../../interfaces/ISerializedEditingHistoryEntity.md)&lt;[IFillingRecipeEntity](../../interfaces/IFillingRecipeEntity.md)&gt;

Serialized editing history
