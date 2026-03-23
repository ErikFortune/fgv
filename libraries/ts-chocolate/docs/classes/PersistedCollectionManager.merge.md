[Home](../README.md) > [PersistedCollectionManager](./PersistedCollectionManager.md) > merge

## PersistedCollectionManager.merge() method

Merge all items from a source collection into a target collection and sync to disk.

**Signature:**

```typescript
merge(sourceCollectionId: CollectionId, targetCollectionId: CollectionId, onConflict: MergeConflictStrategy): Promise<Result<IMergeResult>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>sourceCollectionId</td><td>CollectionId</td><td></td></tr>
<tr><td>targetCollectionId</td><td>CollectionId</td><td></td></tr>
<tr><td>onConflict</td><td>MergeConflictStrategy</td><td></td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[IMergeResult](../interfaces/IMergeResult.md)&gt;&gt;
