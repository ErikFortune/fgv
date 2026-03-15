[Home](../../README.md) > [LibraryRuntime](../README.md) > [IFindOrchestrator](./IFindOrchestrator.md) > convertConfig

## IFindOrchestrator.convertConfig() method

Converts a JSON query specification to a typed config.

**Signature:**

```typescript
convertConfig(json: unknown): Result<TSpec>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>json</td><td>unknown</td><td>JSON object with query configuration</td></tr>
</tbody></table>

**Returns:**

Result&lt;TSpec&gt;

Typed query spec
