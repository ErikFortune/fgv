[Home](../../README.md) > [UserEntities](../README.md) > [IUserEntityLibrary](./IUserEntityLibrary.md) > getPersistedIngredientInventoryCollection

## IUserEntityLibrary.getPersistedIngredientInventoryCollection() method

Get or create a singleton persisted ingredient inventory collection.

**Signature:**

```typescript
getPersistedIngredientInventoryCollection(collectionId: CollectionId): Result<PersistedEditableCollection<IIngredientInventoryEntryEntity, IngredientInventoryEntryBaseId>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>ID of the collection</td></tr>
</tbody></table>

**Returns:**

Result&lt;[PersistedEditableCollection](../../classes/PersistedEditableCollection.md)&lt;[IIngredientInventoryEntryEntity](../../interfaces/IIngredientInventoryEntryEntity.md), [IngredientInventoryEntryBaseId](../../type-aliases/IngredientInventoryEntryBaseId.md)&gt;&gt;

`Success` with persisted wrapper, or `Failure` if collection not found
