[Home](../../README.md) > [UserEntities](../README.md) > [IUserEntityLibrary](./IUserEntityLibrary.md) > getPersistedLocationsCollection

## IUserEntityLibrary.getPersistedLocationsCollection() method

Get or create a singleton persisted locations collection.

**Signature:**

```typescript
getPersistedLocationsCollection(collectionId: CollectionId): Result<PersistedEditableCollection<ILocationEntity, BaseLocationId>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>ID of the collection</td></tr>
</tbody></table>

**Returns:**

Result&lt;[PersistedEditableCollection](../../classes/PersistedEditableCollection.md)&lt;[ILocationEntity](../../interfaces/ILocationEntity.md), [BaseLocationId](../../type-aliases/BaseLocationId.md)&gt;&gt;

`Success` with persisted wrapper, or `Failure` if collection not found
