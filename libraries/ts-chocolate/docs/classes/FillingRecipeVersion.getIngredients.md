[Home](../README.md) > [FillingRecipeVersion](./FillingRecipeVersion.md) > getIngredients

## FillingRecipeVersion.getIngredients() method

Gets ingredients, optionally filtered.

**Signature:**

```typescript
getIngredients(filter?: FillingRecipeIngredientsFilter[]): Result<IterableIterator<IResolvedFillingIngredient<AnyIngredient>, any, any>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>filter</td><td>FillingRecipeIngredientsFilter[]</td><td>Optional array of filters (OR semantics)
  - `undefined`/omitted: returns all ingredients
  - Empty array `[]`: returns nothing (empty iterator)
  - Non-empty array: returns ingredients matching at least one filter</td></tr>
</tbody></table>

**Returns:**

Result&lt;IterableIterator&lt;[IResolvedFillingIngredient](../interfaces/IResolvedFillingIngredient.md)&lt;[AnyIngredient](../type-aliases/AnyIngredient.md)&gt;, any, any&gt;&gt;

Success with matching ingredients iterator, or Failure if resolution fails
