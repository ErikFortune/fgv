[Home](../../README.md) > [UserEntities](../README.md) > [IUserEntityLibrary](./IUserEntityLibrary.md) > getPersistedMoldInventoryCollection

## IUserEntityLibrary.getPersistedMoldInventoryCollection() method

Get or create a singleton persisted mold inventory collection.

**Signature:**

```typescript
getPersistedMoldInventoryCollection(collectionId: CollectionId): Result<PersistedEditableCollection<IMoldInventoryEntryEntity, MoldInventoryEntryBaseId>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>ID of the collection</td></tr>
</tbody></table>

**Returns:**

Result&lt;[PersistedEditableCollection](../../classes/PersistedEditableCollection.md)&lt;[IMoldInventoryEntryEntity](../../interfaces/IMoldInventoryEntryEntity.md), [MoldInventoryEntryBaseId](../../type-aliases/MoldInventoryEntryBaseId.md)&gt;&gt;

`Success` with persisted wrapper, or `Failure` if collection not found
