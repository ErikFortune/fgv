[Home](../../README.md) > [Entities](../README.md) > [IngredientInventoryLibrary](./IngredientInventoryLibrary.md) > upsertEntry

## IngredientInventoryLibrary.upsertEntry() method

Adds or updates an inventory entry.

**Signature:**

```typescript
upsertEntry(collectionId: CollectionId, entryId: IngredientInventoryEntryBaseId, entry: IIngredientInventoryEntryEntity): Result<IngredientInventoryEntryId>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>The inventory collection to upsert into</td></tr>
<tr><td>entryId</td><td>IngredientInventoryEntryBaseId</td><td>The base ID for this inventory entry</td></tr>
<tr><td>entry</td><td>IIngredientInventoryEntryEntity</td><td>The inventory entry data</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IngredientInventoryEntryId](../../type-aliases/IngredientInventoryEntryId.md)&gt;

Success with the composite entry ID, or Failure if upsert fails
