[Home](../../README.md) > [LibraryRuntime](../README.md) > [ChocolateEntityLibrary](./ChocolateEntityLibrary.md) > getPersistedIngredientsCollection

## ChocolateEntityLibrary.getPersistedIngredientsCollection() method

Get or create a singleton persisted ingredients collection.

**Signature:**

```typescript
getPersistedIngredientsCollection(collectionId: CollectionId): Result<PersistedEditableCollection<IngredientEntity, BaseIngredientId>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>ID of the collection</td></tr>
</tbody></table>

**Returns:**

Result&lt;[PersistedEditableCollection](../../classes/PersistedEditableCollection.md)&lt;[IngredientEntity](../../type-aliases/IngredientEntity.md), [BaseIngredientId](../../type-aliases/BaseIngredientId.md)&gt;&gt;

`Success` with persisted wrapper, or `Failure` if collection not found
