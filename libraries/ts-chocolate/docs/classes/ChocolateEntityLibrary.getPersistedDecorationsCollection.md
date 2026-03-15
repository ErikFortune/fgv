[Home](../README.md) > [ChocolateEntityLibrary](./ChocolateEntityLibrary.md) > getPersistedDecorationsCollection

## ChocolateEntityLibrary.getPersistedDecorationsCollection() method

Get or create a singleton persisted decorations collection.

**Signature:**

```typescript
getPersistedDecorationsCollection(collectionId: CollectionId): Result<PersistedEditableCollection<IDecorationEntity, BaseDecorationId>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>ID of the collection</td></tr>
</tbody></table>

**Returns:**

Result&lt;[PersistedEditableCollection](PersistedEditableCollection.md)&lt;[IDecorationEntity](../interfaces/IDecorationEntity.md), [BaseDecorationId](../type-aliases/BaseDecorationId.md)&gt;&gt;

`Success` with persisted wrapper, or `Failure` if collection not found
