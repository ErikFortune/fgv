[Home](../README.md) > [IEntityResolver](./IEntityResolver.md) > isId

## IEntityResolver.isId() method

Type guard to check if a value is an ID (not an entity).

**Signature:**

```typescript
isId(value: TEntity | TId): value is TId;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>value</td><td>TEntity | TId</td><td>The value to check</td></tr>
</tbody></table>

**Returns:**

value is TId

True if the value is an ID
