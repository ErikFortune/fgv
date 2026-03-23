[Home](../README.md) > [PersistedCollectionManager](./PersistedCollectionManager.md) > importCollection

## PersistedCollectionManager.importCollection() method

Import a collection with items and metadata, then sync to disk.

Unlike createWithFile, this accepts pre-existing items (e.g., from
a file import) and does not create a backing YAML file — the items are
added in-memory and synced via the sync provider.

**Signature:**

```typescript
importCollection(collectionId: CollectionId, items: readonly [string, TItem][] | undefined, metadata?: ICollectionRuntimeMetadata): Promise<Result<CollectionId>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>ID for the new collection</td></tr>
<tr><td>items</td><td>readonly [string, TItem][] | undefined</td><td>Array of [baseId, item] entries to add</td></tr>
<tr><td>metadata</td><td>ICollectionRuntimeMetadata</td><td>Optional runtime metadata for the collection</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[CollectionId](../type-aliases/CollectionId.md)&gt;&gt;

Success with the collection entry, or Failure
