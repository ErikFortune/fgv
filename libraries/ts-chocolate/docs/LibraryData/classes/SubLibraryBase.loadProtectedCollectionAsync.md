[Home](../../README.md) > [LibraryData](../README.md) > [SubLibraryBase](./SubLibraryBase.md) > loadProtectedCollectionAsync

## SubLibraryBase.loadProtectedCollectionAsync() method

Decrypts and loads one or more protected collections.

**Signature:**

```typescript
loadProtectedCollectionAsync(encryption: IEncryptionConfig, filter?: readonly (string | RegExp)[]): Promise<Result<readonly CollectionId[]>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>encryption</td><td>IEncryptionConfig</td><td>The encryption configuration with keys and crypto provider.</td></tr>
<tr><td>filter</td><td>readonly (string | RegExp)[]</td><td>Optional filter to select which protected collections to load.
  - If omitted or `undefined`: Load all protected collections that can be decrypted with provided keys.
  - If an array of patterns: Only load collections whose collectionId or secretName matches any pattern.
    Patterns can be strings (exact match) or RegExp objects.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;readonly [CollectionId](../../type-aliases/CollectionId.md)[]&gt;&gt;

Promise resolving to Success with array of loaded collection IDs, or Failure with error.
