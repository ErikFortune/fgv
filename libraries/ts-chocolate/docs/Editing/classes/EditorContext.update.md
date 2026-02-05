[Home](../../README.md) > [Editing](../README.md) > [EditorContext](./EditorContext.md) > update

## EditorContext.update() method

Update existing entity.

**Signature:**

```typescript
update(id: TId, entity: T): Result<T>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>id</td><td>TId</td><td>Entity ID</td></tr>
<tr><td>entity</td><td>T</td><td>Pre-validated updated entity data</td></tr>
</tbody></table>

**Returns:**

Result&lt;T&gt;

Result indicating success or failure
