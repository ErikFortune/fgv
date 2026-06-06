[Home](../../README.md) > [Hints](../README.md) > [IHintRegistry](./IHintRegistry.md) > getProvider

## IHintRegistry.getProvider() method

Gets a specific provider by technique ID.

**Signature:**

```typescript
getProvider(techniqueId: TechniqueId): Result<IHintProvider>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>techniqueId</td><td>TechniqueId</td><td>The ID of the technique</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IHintProvider](../../interfaces/IHintProvider.md)&gt;

Result containing the provider, or failure if not found
