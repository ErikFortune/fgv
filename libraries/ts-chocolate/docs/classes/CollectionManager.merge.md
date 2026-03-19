[Home](../README.md) > [CollectionManager](./CollectionManager.md) > merge

## CollectionManager.merge() method

Merge all items from a source collection into a target collection.

Moves items from source to target, applying the specified conflict strategy
when both collections contain an item with the same base ID. After merging,
the source collection is deleted.

Does NOT update cross-entity references — callers must handle that separately.

**Signature:**

```typescript
merge(sourceCollectionId: CollectionId, targetCollectionId: CollectionId, onConflict: MergeConflictStrategy): Result<IMergeResult>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>sourceCollectionId</td><td>CollectionId</td><td></td></tr>
<tr><td>targetCollectionId</td><td>CollectionId</td><td></td></tr>
<tr><td>onConflict</td><td>MergeConflictStrategy</td><td></td></tr>
</tbody></table>

**Returns:**

Result&lt;[IMergeResult](../interfaces/IMergeResult.md)&gt;
