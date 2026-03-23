[Home](../README.md) > [PersistedCollectionManager](./PersistedCollectionManager.md) > rename

## PersistedCollectionManager.rename() method

Rename a mutable collection to a new ID and sync to disk.

**Signature:**

```typescript
rename(oldCollectionId: CollectionId, newCollectionId: CollectionId): Promise<Result<CollectionId>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>oldCollectionId</td><td>CollectionId</td><td></td></tr>
<tr><td>newCollectionId</td><td>CollectionId</td><td></td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[CollectionId](../type-aliases/CollectionId.md)&gt;&gt;
