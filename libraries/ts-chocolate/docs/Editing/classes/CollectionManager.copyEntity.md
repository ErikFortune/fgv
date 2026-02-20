[Home](../../README.md) > [Editing](../README.md) > [CollectionManager](./CollectionManager.md) > copyEntity

## CollectionManager.copyEntity() method

Copy an entity to another collection.

**Signature:**

```typescript
copyEntity(compositeId: string, targetCollectionId: CollectionId, newBaseId?: string): Result<string>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>compositeId</td><td>string</td><td>Source composite entity ID (collectionId.baseId)</td></tr>
<tr><td>targetCollectionId</td><td>CollectionId</td><td>Target collection ID</td></tr>
<tr><td>newBaseId</td><td>string</td><td>Optional new base ID; defaults to source base ID</td></tr>
</tbody></table>

**Returns:**

Result&lt;string&gt;

Result containing the new composite ID or failure
