[Home](../../README.md) > [Indexers](../README.md) > [FillingRecipeIndexerOrchestrator](./FillingRecipeIndexerOrchestrator.md) > find

## FillingRecipeIndexerOrchestrator.find() method

Finds recipes matching a query specification.

**Signature:**

```typescript
find(spec: IFillingRecipeQuerySpec, options?: IFindOptions): Result<readonly FillingRecipe[]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>IFillingRecipeQuerySpec</td><td>Query specification with configs keyed by indexer name</td></tr>
<tr><td>options</td><td>IFindOptions</td><td>Optional find options (aggregation mode)</td></tr>
</tbody></table>

**Returns:**

Result&lt;readonly [FillingRecipe](../../classes/FillingRecipe.md)[]&gt;

Array of matching recipes
