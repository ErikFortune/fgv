[Home](../../README.md) > [LibraryRuntime](../README.md) > [ChocolateEntityLibrary](./ChocolateEntityLibrary.md) > getPersistedConfectionsCollection

## ChocolateEntityLibrary.getPersistedConfectionsCollection() method

Get or create a singleton persisted confections collection.

**Signature:**

```typescript
getPersistedConfectionsCollection(collectionId: CollectionId): Result<PersistedEditableCollection<AnyConfectionRecipeEntity, BaseConfectionId>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>ID of the collection</td></tr>
</tbody></table>

**Returns:**

Result&lt;[PersistedEditableCollection](../../classes/PersistedEditableCollection.md)&lt;[AnyConfectionRecipeEntity](../../type-aliases/AnyConfectionRecipeEntity.md), [BaseConfectionId](../../type-aliases/BaseConfectionId.md)&gt;&gt;

`Success` with persisted wrapper, or `Failure` if collection not found
