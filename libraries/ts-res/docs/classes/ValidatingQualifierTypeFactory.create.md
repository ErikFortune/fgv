[Home](../README.md) > [ValidatingQualifierTypeFactory](./ValidatingQualifierTypeFactory.md) > create

## ValidatingQualifierTypeFactory.create() method

Creates a qualifier type from a weakly-typed configuration object.

**Signature:**

```typescript
create(config: unknown): Result<SystemQualifierType | T>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>config</td><td>unknown</td><td>The configuration object to validate and use for creation.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[SystemQualifierType](../type-aliases/SystemQualifierType.md) | T&gt;

A result containing the new qualifier type if successful.
