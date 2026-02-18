[Home](../../README.md) > [Editing](../README.md) > [EditorContext](./EditorContext.md) > updateFromWrapper

## EditorContext.updateFromWrapper() method

Update existing entity from a snapshot provider (e.g. an EditableWrapper).
Convenience method that calls wrapper.snapshot and delegates to update().

**Signature:**

```typescript
updateFromWrapper(id: TId, wrapper: ISnapshotProvider<T>): Result<T>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>id</td><td>TId</td><td>Entity ID</td></tr>
<tr><td>wrapper</td><td>ISnapshotProvider&lt;T&gt;</td><td>Any ISnapshotProvider whose current snapshot will be saved</td></tr>
</tbody></table>

**Returns:**

Result&lt;T&gt;

Result indicating success or failure
