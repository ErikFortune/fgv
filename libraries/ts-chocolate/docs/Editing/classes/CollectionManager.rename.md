[Home](../../README.md) > [Editing](../README.md) > [CollectionManager](./CollectionManager.md) > rename

## CollectionManager.rename() method

Rename a mutable collection to a new ID.

Creates a new collection with the new ID containing all items and metadata
from the old collection, creates a new backing file, then deletes the old
collection and its backing file.

Does NOT update cross-entity references — callers must handle that separately.

**Signature:**

```typescript
rename(oldCollectionId: CollectionId, newCollectionId: CollectionId): Result<CollectionId>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>oldCollectionId</td><td>CollectionId</td><td></td></tr>
<tr><td>newCollectionId</td><td>CollectionId</td><td></td></tr>
</tbody></table>

**Returns:**

Result&lt;[CollectionId](../../type-aliases/CollectionId.md)&gt;
