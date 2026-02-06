[Home](../../README.md) > [LibraryRuntime](../README.md) > [ChocolateEntityLibrary](./ChocolateEntityLibrary.md) > getEditableMoldsEntityCollection

## ChocolateEntityLibrary.getEditableMoldsEntityCollection() method

Get an editable molds collection with persistence enabled.

**Signature:**

```typescript
getEditableMoldsEntityCollection(collectionId: CollectionId): Result<EditableCollection<IMoldEntity, BaseMoldId>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>ID of the collection to make editable</td></tr>
</tbody></table>

**Returns:**

Result&lt;[EditableCollection](../../classes/EditableCollection.md)&lt;[IMoldEntity](../../interfaces/IMoldEntity.md), [BaseMoldId](../../type-aliases/BaseMoldId.md)&gt;&gt;

Result containing EditableCollection with persistence, or Failure
