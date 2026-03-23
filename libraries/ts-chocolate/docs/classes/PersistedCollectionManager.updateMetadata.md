[Home](../README.md) > [PersistedCollectionManager](./PersistedCollectionManager.md) > updateMetadata

## PersistedCollectionManager.updateMetadata() method

Update collection metadata and sync to disk.

**Signature:**

```typescript
updateMetadata(collectionId: CollectionId, metadata: Partial<ICollectionRuntimeMetadata>): Promise<Result<ICollectionRuntimeMetadata>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td></td></tr>
<tr><td>metadata</td><td>Partial&lt;ICollectionRuntimeMetadata&gt;</td><td></td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[ICollectionRuntimeMetadata](../interfaces/ICollectionRuntimeMetadata.md)&gt;&gt;
