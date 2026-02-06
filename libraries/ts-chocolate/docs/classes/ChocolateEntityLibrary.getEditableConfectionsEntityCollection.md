[Home](../README.md) > [ChocolateEntityLibrary](./ChocolateEntityLibrary.md) > getEditableConfectionsEntityCollection

## ChocolateEntityLibrary.getEditableConfectionsEntityCollection() method

Get an editable confections collection with persistence enabled.

**Signature:**

```typescript
getEditableConfectionsEntityCollection(collectionId: CollectionId): Result<EditableCollection<AnyConfectionRecipeEntity, BaseConfectionId>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>ID of the collection to make editable</td></tr>
</tbody></table>

**Returns:**

Result&lt;[EditableCollection](EditableCollection.md)&lt;[AnyConfectionRecipeEntity](../type-aliases/AnyConfectionRecipeEntity.md), [BaseConfectionId](../type-aliases/BaseConfectionId.md)&gt;&gt;

Result containing EditableCollection with persistence, or Failure
