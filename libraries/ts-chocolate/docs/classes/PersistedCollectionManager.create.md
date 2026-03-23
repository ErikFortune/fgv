[Home](../README.md) > [PersistedCollectionManager](./PersistedCollectionManager.md) > create

## PersistedCollectionManager.create() method

Create a new mutable collection in memory.
Note: This does not create a backing file. Use createWithFile for persistence.

**Signature:**

```typescript
create(collectionId: CollectionId, metadata: ICollectionFileMetadata): Result<AggregatedResultMapEntry<CollectionId, TBaseId, TItem>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td></td></tr>
<tr><td>metadata</td><td>ICollectionFileMetadata</td><td></td></tr>
</tbody></table>

**Returns:**

Result&lt;AggregatedResultMapEntry&lt;[CollectionId](../type-aliases/CollectionId.md), TBaseId, TItem&gt;&gt;
