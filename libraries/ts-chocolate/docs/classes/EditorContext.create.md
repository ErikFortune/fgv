[Home](../README.md) > [EditorContext](./EditorContext.md) > create

## EditorContext.create() method

Create new entity with specified base ID.

**Signature:**

```typescript
create(baseId: TBaseId | undefined, entity: T): Result<TId>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>baseId</td><td>TBaseId | undefined</td><td>Pre-validated base identifier, or undefined to auto-generate from entity name</td></tr>
<tr><td>entity</td><td>T</td><td>Pre-validated entity data</td></tr>
</tbody></table>

**Returns:**

Result&lt;TId&gt;

Result containing the generated entity ID or failure
