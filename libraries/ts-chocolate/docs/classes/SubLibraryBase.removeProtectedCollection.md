[Home](../README.md) > [SubLibraryBase](./SubLibraryBase.md) > removeProtectedCollection

## SubLibraryBase.removeProtectedCollection() method

Removes a protected (encrypted) collection and deletes its backing file.

Use this to clean up an encrypted collection whose ID conflicts with a loaded
collection from another storage root (e.g., an orphaned encrypted local copy
when an unencrypted cloud copy of the same collection is already loaded).

**Signature:**

```typescript
removeProtectedCollection(collectionId: string): Result<true>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>string</td><td>The protected collection ID to remove.</td></tr>
</tbody></table>

**Returns:**

Result&lt;true&gt;

Result<true> on success, or Failure if the collection is not found.
