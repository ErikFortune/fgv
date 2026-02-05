[Home](../../README.md) > [Entities](../README.md) > [SessionLibrary](./SessionLibrary.md) > createCollection

## SessionLibrary.createCollection() method

Creates a new mutable collection for sessions.

**Signature:**

```typescript
createCollection(collectionId: CollectionId, metadata?: ICollectionSourceMetadata): Result<CollectionId>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>The ID for the new collection</td></tr>
<tr><td>metadata</td><td>ICollectionSourceMetadata</td><td>Optional metadata for the collection</td></tr>
</tbody></table>

**Returns:**

Result&lt;[CollectionId](../../type-aliases/CollectionId.md)&gt;

Success with the collection ID, or Failure if creation fails
