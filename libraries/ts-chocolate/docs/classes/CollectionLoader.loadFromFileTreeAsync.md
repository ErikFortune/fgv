[Home](../README.md) > [CollectionLoader](./CollectionLoader.md) > loadFromFileTreeAsync

## CollectionLoader.loadFromFileTreeAsync() method

Loads collections from a `FileTree` asynchronously, supporting encrypted files.

When encryption config is provided, attempts to decrypt encrypted files.
Files that cannot be decrypted (missing key with skip/warn/capture mode) are
captured in the result's `protectedCollections` for later decryption.

**Signature:**

```typescript
loadFromFileTreeAsync(fileTree: FileTreeItem, params: ILoadCollectionFromFileTreeParams<TCOLLECTIONID>): Promise<Result<ICollectionLoadResult<T, TCOLLECTIONID, TITEMID>>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>fileTree</td><td>FileTreeItem</td><td>The `FileTree` from which to load collections.</td></tr>
<tr><td>params</td><td>ILoadCollectionFromFileTreeParams&lt;TCOLLECTIONID&gt;</td><td>optional LibraryData.ILoadCollectionFromFileTreeParams | parameters to control filtering
and recursion.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[ICollectionLoadResult](../interfaces/ICollectionLoadResult.md)&lt;T, TCOLLECTIONID, TITEMID&gt;&gt;&gt;

Promise resolving to Success with load result, or Failure with error.
