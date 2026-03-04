[Home](../README.md) > [ChocolateEntityLibrary](./ChocolateEntityLibrary.md) > getPersistedMoldsCollection

## ChocolateEntityLibrary.getPersistedMoldsCollection() method

Get or create a singleton persisted molds collection.

**Signature:**

```typescript
getPersistedMoldsCollection(collectionId: CollectionId): Result<PersistedEditableCollection<IMoldEntity, BaseMoldId>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>ID of the collection</td></tr>
</tbody></table>

**Returns:**

Result&lt;[PersistedEditableCollection](PersistedEditableCollection.md)&lt;[IMoldEntity](../interfaces/IMoldEntity.md), [BaseMoldId](../type-aliases/BaseMoldId.md)&gt;&gt;

`Success` with persisted wrapper, or `Failure` if collection not found
