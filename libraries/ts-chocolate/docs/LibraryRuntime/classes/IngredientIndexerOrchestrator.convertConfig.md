[Home](../../README.md) > [LibraryRuntime](../README.md) > [IngredientIndexerOrchestrator](./IngredientIndexerOrchestrator.md) > convertConfig

## IngredientIndexerOrchestrator.convertConfig() method

Converts a JSON query specification to a typed config.

**Signature:**

```typescript
convertConfig(json: unknown): Result<IIngredientQuerySpec>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>json</td><td>unknown</td><td>JSON object with indexer name strings as keys and config objects as values</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IIngredientQuerySpec](../../interfaces/IIngredientQuerySpec.md)&gt;

Typed query spec
