[Home](../README.md) > [SubLibraryBase](./SubLibraryBase.md) > renameConflictingCopyAsync

## SubLibraryBase.renameConflictingCopyAsync() method

Renames a conflicting (loser) copy to a new collection ID.

Re-reads the loser's backing file (decrypting if necessary), adds the items
as a new mutable collection under `newCollectionId`, creates a backing file,
and deletes the loser's old file.

**Signature:**

```typescript
renameConflictingCopyAsync(collectionId: string, sourceName: string | undefined, newCollectionId: CollectionId, encryption?: IEncryptionConfig): Promise<Result<true>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>string</td><td>The collection ID with a conflict.</td></tr>
<tr><td>sourceName</td><td>string | undefined</td><td>The `sourceName` of the conflicting copy to rename.</td></tr>
<tr><td>newCollectionId</td><td>CollectionId</td><td>The new collection ID (must not already exist).</td></tr>
<tr><td>encryption</td><td>IEncryptionConfig</td><td>Optional encryption config for encrypted copies.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;true&gt;&gt;

Result<true> on success, or Failure.
