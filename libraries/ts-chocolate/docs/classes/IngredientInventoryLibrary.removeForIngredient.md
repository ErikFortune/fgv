[Home](../README.md) > [IngredientInventoryLibrary](./IngredientInventoryLibrary.md) > removeForIngredient

## IngredientInventoryLibrary.removeForIngredient() method

Removes an inventory entry for a specific ingredient.
Searches all collections for the entry with matching ingredientId.

**Signature:**

```typescript
removeForIngredient(ingredientId: IngredientId): Result<IIngredientInventoryEntryEntity>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>ingredientId</td><td>IngredientId</td><td>The composite IngredientId of the ingredient whose inventory to remove</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IIngredientInventoryEntryEntity](../interfaces/IIngredientInventoryEntryEntity.md)&gt;

Success with the removed entry, or Failure if not found or remove fails
