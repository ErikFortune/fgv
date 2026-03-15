[Home](../../README.md) > [LibraryData](../README.md) > [SubLibraryBase](./SubLibraryBase.md) > getCollectionOperations

## SubLibraryBase.getCollectionOperations() method

Returns a default collection operations delegate for the given collection.

The returned object provides `add`, `upsert`, and `remove` methods that
operate on this sub-library's collection. Editing.PersistedEditableCollection
uses this to perform domain-aware mutations and then automatically persist.

Sub-classes can override to add custom behavior (e.g., branded composite ID
construction, field-based validation, cross-collection checks).

**Signature:**

```typescript
getCollectionOperations(collectionId: CollectionId): { add: any; upsert: any; remove: any };
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>The collection to operate on</td></tr>
</tbody></table>

**Returns:**

{ add: any; upsert: any; remove: any }

An operations delegate with add/upsert/remove methods
