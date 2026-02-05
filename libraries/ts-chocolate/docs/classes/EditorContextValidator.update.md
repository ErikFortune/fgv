[Home](../README.md) > [EditorContextValidator](./EditorContextValidator.md) > update

## EditorContextValidator.update() method

Update existing entity with validation.
Validates the raw entity using the converter, then delegates to the base context.

**Signature:**

```typescript
update(id: TId, rawEntity: unknown): Result<T>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>id</td><td>TId</td><td>Entity ID</td></tr>
<tr><td>rawEntity</td><td>unknown</td><td>Raw updated entity data to validate</td></tr>
</tbody></table>

**Returns:**

Result&lt;T&gt;

Result indicating success or failure
