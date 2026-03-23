[Home](../../README.md) > [Editing](../README.md) > [PersistedCollectionManager](./PersistedCollectionManager.md) > delete

## PersistedCollectionManager.delete() method

Delete a mutable collection and sync to disk.

**Signature:**

```typescript
delete(collectionId: CollectionId): Promise<Result<AggregatedResultMapEntry<CollectionId, TBaseId, TItem, ICollectionRuntimeMetadata>>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td></td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;AggregatedResultMapEntry&lt;[CollectionId](../../type-aliases/CollectionId.md), TBaseId, TItem, [ICollectionRuntimeMetadata](../../interfaces/ICollectionRuntimeMetadata.md)&gt;&gt;&gt;
