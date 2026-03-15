[Home](../README.md) > [IngredientInventoryLibrary](./IngredientInventoryLibrary.md) > removeEntry

## IngredientInventoryLibrary.removeEntry() method

Removes an inventory entry by its composite entry ID.

**Signature:**

```typescript
removeEntry(entryId: IngredientInventoryEntryId): Result<IIngredientInventoryEntryEntity>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>entryId</td><td>IngredientInventoryEntryId</td><td>The composite inventory entry ID to remove</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IIngredientInventoryEntryEntity](../interfaces/IIngredientInventoryEntryEntity.md)&gt;

Success with the removed entry, or Failure if not found or remove fails
