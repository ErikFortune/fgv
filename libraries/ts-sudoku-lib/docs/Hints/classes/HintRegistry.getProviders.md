[Home](../../README.md) > [Hints](../README.md) > [HintRegistry](./HintRegistry.md) > getProviders

## HintRegistry.getProviders() method

Gets all registered providers, optionally filtered by criteria.

**Signature:**

```typescript
getProviders(options?: IHintGenerationOptions): readonly IHintProvider[];
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>options</td><td>IHintGenerationOptions</td><td>Optional filtering options</td></tr>
</tbody></table>

**Returns:**

readonly [IHintProvider](../../interfaces/IHintProvider.md)[]

Array of providers matching the criteria
