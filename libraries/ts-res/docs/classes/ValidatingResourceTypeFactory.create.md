[Home](../README.md) > [ValidatingResourceTypeFactory](./ValidatingResourceTypeFactory.md) > create

## ValidatingResourceTypeFactory.create() method

Creates a resource type from a weakly-typed configuration object.

**Signature:**

```typescript
create(config: unknown): Result<ResourceType<unknown>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>config</td><td>unknown</td><td>The configuration object to validate and use for creation.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ResourceType](ResourceType.md)&lt;unknown&gt;&gt;

A result containing the new resource type if successful.
