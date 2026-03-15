[Home](../../README.md) > [LibraryRuntime](../README.md) > [ChocolateEntityLibrary](./ChocolateEntityLibrary.md) > getEditableIngredientsEntityCollection

## ChocolateEntityLibrary.getEditableIngredientsEntityCollection() method

Get an editable ingredients collection with persistence enabled.

**Signature:**

```typescript
getEditableIngredientsEntityCollection(collectionId: CollectionId, encryptionProvider?: IEncryptionProvider): Result<EditableCollection<IngredientEntity, BaseIngredientId>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>ID of the collection to make editable</td></tr>
<tr><td>encryptionProvider</td><td>IEncryptionProvider</td><td>Optional encryption provider for encrypted save support</td></tr>
</tbody></table>

**Returns:**

Result&lt;[EditableCollection](../../classes/EditableCollection.md)&lt;[IngredientEntity](../../type-aliases/IngredientEntity.md), [BaseIngredientId](../../type-aliases/BaseIngredientId.md)&gt;&gt;

Result containing EditableCollection with persistence, or Failure
