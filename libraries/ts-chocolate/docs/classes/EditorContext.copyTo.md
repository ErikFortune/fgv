[Home](../README.md) > [EditorContext](./EditorContext.md) > copyTo

## EditorContext.copyTo() method

Copy entity to another collection.
This method must be overridden by derived classes that need copy functionality.

**Signature:**

```typescript
copyTo(id: TId, targetCollectionId: CollectionId): Result<TId>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>id</td><td>TId</td><td>Source entity ID</td></tr>
<tr><td>targetCollectionId</td><td>CollectionId</td><td>Target collection ID</td></tr>
</tbody></table>

**Returns:**

Result&lt;TId&gt;

Result containing the new entity ID in target collection or failure
