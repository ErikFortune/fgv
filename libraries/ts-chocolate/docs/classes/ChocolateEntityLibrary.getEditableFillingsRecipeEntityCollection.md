[Home](../README.md) > [ChocolateEntityLibrary](./ChocolateEntityLibrary.md) > getEditableFillingsRecipeEntityCollection

## ChocolateEntityLibrary.getEditableFillingsRecipeEntityCollection() method

Get an editable fillings collection with persistence enabled.

**Signature:**

```typescript
getEditableFillingsRecipeEntityCollection(collectionId: CollectionId): Result<EditableCollection<IFillingRecipeEntity, BaseFillingId>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>ID of the collection to make editable</td></tr>
</tbody></table>

**Returns:**

Result&lt;[EditableCollection](EditableCollection.md)&lt;[IFillingRecipeEntity](../interfaces/IFillingRecipeEntity.md), [BaseFillingId](../type-aliases/BaseFillingId.md)&gt;&gt;

Result containing EditableCollection with persistence, or Failure
