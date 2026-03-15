[Home](../../README.md) > [Editing](../README.md) > [CollectionManager](./CollectionManager.md) > createWithFile

## CollectionManager.createWithFile() method

Create a new mutable collection with a backing YAML file on disk.

Creates both the in-memory collection and a YAML file in the library's
mutable data directory, enabling `EditableCollection.save()` to work.

**Signature:**

```typescript
createWithFile(collectionId: CollectionId, metadata: ICollectionFileMetadata): Result<AggregatedResultMapEntry<CollectionId, TBaseId, TItem, ICollectionRuntimeMetadata>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>ID for the new collection</td></tr>
<tr><td>metadata</td><td>ICollectionFileMetadata</td><td>Collection metadata (name, description, etc.)</td></tr>
</tbody></table>

**Returns:**

Result&lt;AggregatedResultMapEntry&lt;[CollectionId](../../type-aliases/CollectionId.md), TBaseId, TItem, [ICollectionRuntimeMetadata](../../interfaces/ICollectionRuntimeMetadata.md)&gt;&gt;

Success with the collection entry, or Failure if creation fails
