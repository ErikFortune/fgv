[Home](../README.md) > [CollectionLoader](./CollectionLoader.md) > loadFromFileTree

## CollectionLoader.loadFromFileTree() method

Loads collections from a `FileTree` using optional filtering parameters.

Encrypted collections are handled according to `onEncryptedFile`:
- `'fail'`: Fail the entire load operation
- `'skip'`: Silently skip encrypted files
- `'warn'`: Log warning and skip
- `'capture'`: Capture encrypted files for later decryption (default)

Use LibraryData.CollectionLoader.loadFromFileTreeAsync | loadFromFileTreeAsync
to decrypt encrypted files during loading.

**Signature:**

```typescript
loadFromFileTree(fileTree: FileTreeItem, params?: ILoadCollectionFromFileTreeParams<TCOLLECTIONID>): Result<ICollectionLoadResult<T, TCOLLECTIONID, TITEMID>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>fileTree</td><td>FileTreeItem</td><td>The `FileTree` from which to load collections.</td></tr>
<tr><td>params</td><td>ILoadCollectionFromFileTreeParams&lt;TCOLLECTIONID&gt;</td><td>optional LibraryData.ILoadCollectionFromFileTreeParams | parameters to control filtering
and recursion.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ICollectionLoadResult](../interfaces/ICollectionLoadResult.md)&lt;T, TCOLLECTIONID, TITEMID&gt;&gt;

Success with load result containing collections and captured protected collections, or Failure with error.
