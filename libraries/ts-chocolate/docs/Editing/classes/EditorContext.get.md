[Home](../../README.md) > [Editing](../README.md) > [EditorContext](./EditorContext.md) > get

## EditorContext.get() method

Get entity by ID.

**Signature:**

```typescript
get(id: TId): Result<T>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>id</td><td>TId</td><td>Entity ID (composite: collectionId.baseId)</td></tr>
</tbody></table>

**Returns:**

Result&lt;T&gt;

Result containing the entity or failure
