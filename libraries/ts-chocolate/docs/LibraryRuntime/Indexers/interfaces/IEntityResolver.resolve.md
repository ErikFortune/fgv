[Home](../../../README.md) > [LibraryRuntime](../../README.md) > [Indexers](../README.md) > [IEntityResolver](./IEntityResolver.md) > resolve

## IEntityResolver.resolve() method

Resolves an entity ID to an entity.

**Signature:**

```typescript
resolve(id: TId): Result<TEntity>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>id</td><td>TId</td><td>The entity ID</td></tr>
</tbody></table>

**Returns:**

Result&lt;TEntity&gt;

Success with entity, or Failure if not found
