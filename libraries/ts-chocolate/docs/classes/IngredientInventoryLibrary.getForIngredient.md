[Home](../README.md) > [IngredientInventoryLibrary](./IngredientInventoryLibrary.md) > getForIngredient

## IngredientInventoryLibrary.getForIngredient() method

Gets the inventory entry for a specific ingredient by searching all entries.

**Signature:**

```typescript
getForIngredient(ingredientId: IngredientId): Result<IIngredientInventoryEntryEntity>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>ingredientId</td><td>IngredientId</td><td>The composite IngredientId of the ingredient to look up</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IIngredientInventoryEntryEntity](../interfaces/IIngredientInventoryEntryEntity.md)&gt;

Success with the inventory entry, or Failure if not found
