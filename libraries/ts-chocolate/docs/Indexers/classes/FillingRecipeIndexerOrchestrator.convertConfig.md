[Home](../../README.md) > [Indexers](../README.md) > [FillingRecipeIndexerOrchestrator](./FillingRecipeIndexerOrchestrator.md) > convertConfig

## FillingRecipeIndexerOrchestrator.convertConfig() method

Converts a JSON query specification to a typed config.

**Signature:**

```typescript
convertConfig(json: unknown): Result<IFillingRecipeQuerySpec>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>json</td><td>unknown</td><td>JSON object with indexer name strings as keys and config objects as values</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IFillingRecipeQuerySpec](../../interfaces/IFillingRecipeQuerySpec.md)&gt;

Typed query spec
