[Home](../../README.md) > [Editing](../README.md) > [PersistedCollectionManager](./PersistedCollectionManager.md) > createWithFile

## PersistedCollectionManager.createWithFile() method

Create a new mutable collection with a backing YAML file on disk and sync.

**Signature:**

```typescript
createWithFile(collectionId: CollectionId, metadata: ICollectionFileMetadata): Promise<Result<AggregatedResultMapEntry<CollectionId, TBaseId, TItem, ICollectionRuntimeMetadata>>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>ID for the new collection</td></tr>
<tr><td>metadata</td><td>ICollectionFileMetadata</td><td>Collection metadata</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;AggregatedResultMapEntry&lt;[CollectionId](../../type-aliases/CollectionId.md), TBaseId, TItem, [ICollectionRuntimeMetadata](../../interfaces/ICollectionRuntimeMetadata.md)&gt;&gt;&gt;

Success with the collection entry, or Failure
