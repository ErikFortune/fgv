[Home](../../README.md) > [Editing](../README.md) > [EditorContextValidator](./EditorContextValidator.md) > create

## EditorContextValidator.create() method

Create new entity with validation.
Validates the raw entity using the converter, then delegates to the base context.

**Signature:**

```typescript
create(baseId: string, rawEntity: unknown): Result<TId>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>baseId</td><td>string</td><td>Raw base identifier string, or empty string to auto-generate from entity name</td></tr>
<tr><td>rawEntity</td><td>unknown</td><td>Raw entity data to validate and create</td></tr>
</tbody></table>

**Returns:**

Result&lt;TId&gt;

Result containing the generated entity ID or failure
