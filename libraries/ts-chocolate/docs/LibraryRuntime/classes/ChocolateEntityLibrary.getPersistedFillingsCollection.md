[Home](../../README.md) > [LibraryRuntime](../README.md) > [ChocolateEntityLibrary](./ChocolateEntityLibrary.md) > getPersistedFillingsCollection

## ChocolateEntityLibrary.getPersistedFillingsCollection() method

Get or create a singleton persisted fillings collection.

**Signature:**

```typescript
getPersistedFillingsCollection(collectionId: CollectionId): Result<PersistedEditableCollection<IFillingRecipeEntity, BaseFillingId>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>ID of the collection</td></tr>
</tbody></table>

**Returns:**

Result&lt;[PersistedEditableCollection](../../classes/PersistedEditableCollection.md)&lt;[IFillingRecipeEntity](../../interfaces/IFillingRecipeEntity.md), [BaseFillingId](../../type-aliases/BaseFillingId.md)&gt;&gt;

`Success` with persisted wrapper, or `Failure` if collection not found
