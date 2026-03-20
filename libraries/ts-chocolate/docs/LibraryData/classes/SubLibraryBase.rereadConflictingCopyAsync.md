[Home](../../README.md) > [LibraryData](../README.md) > [SubLibraryBase](./SubLibraryBase.md) > rereadConflictingCopyAsync

## SubLibraryBase.rereadConflictingCopyAsync() method

Re-reads items from a conflicting (loser) copy's backing file.

For unencrypted copies, reads and parses the YAML/JSON file directly.
For encrypted copies, reads the file, decrypts using the provided
encryption config, and converts items. If no encryption config is
provided for an encrypted copy, fails with the secret name needed.

**Signature:**

```typescript
rereadConflictingCopyAsync(collectionId: string, sourceName: string | undefined, encryption?: IEncryptionConfig): Promise<Result<ICollectionSourceFile<TItem>>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>string</td><td>The collection ID with a conflict.</td></tr>
<tr><td>sourceName</td><td>string | undefined</td><td>The `sourceName` of the conflicting copy to read.</td></tr>
<tr><td>encryption</td><td>IEncryptionConfig</td><td>Optional encryption config for decrypting encrypted copies.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[ICollectionSourceFile](../../interfaces/ICollectionSourceFile.md)&lt;TItem&gt;&gt;&gt;

Result with the parsed items and metadata, or Failure.
