[Home](../README.md) > [IngredientIndexerOrchestrator](./IngredientIndexerOrchestrator.md) > find

## IngredientIndexerOrchestrator.find() method

Finds ingredients matching a query specification.

**Signature:**

```typescript
find(spec: IIngredientQuerySpec, options?: IFindOptions): Result<readonly AnyIngredient[]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>IIngredientQuerySpec</td><td>Query specification with configs keyed by indexer name</td></tr>
<tr><td>options</td><td>IFindOptions</td><td>Optional find options (aggregation mode)</td></tr>
</tbody></table>

**Returns:**

Result&lt;readonly [AnyIngredient](../type-aliases/AnyIngredient.md)[]&gt;

Array of matching ingredients
