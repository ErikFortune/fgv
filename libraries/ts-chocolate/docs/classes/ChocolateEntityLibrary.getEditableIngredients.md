[Home](../README.md) > [ChocolateEntityLibrary](./ChocolateEntityLibrary.md) > getEditableIngredients

## ChocolateEntityLibrary.getEditableIngredients() method

Get an editable ingredients collection with persistence enabled.

**Signature:**

```typescript
getEditableIngredients(collectionId: CollectionId): Result<EditableCollection<IngredientEntity, BaseIngredientId>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>ID of the collection to make editable</td></tr>
</tbody></table>

**Returns:**

Result&lt;[EditableCollection](EditableCollection.md)&lt;[IngredientEntity](../type-aliases/IngredientEntity.md), [BaseIngredientId](../type-aliases/BaseIngredientId.md)&gt;&gt;

Result containing EditableCollection with persistence, or Failure
