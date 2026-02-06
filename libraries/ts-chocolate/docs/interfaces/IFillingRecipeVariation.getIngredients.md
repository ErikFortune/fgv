[Home](../README.md) > [IFillingRecipeVariation](./IFillingRecipeVariation.md) > getIngredients

## IFillingRecipeVariation.getIngredients() method

Gets ingredients, optionally filtered.

**Signature:**

```typescript
getIngredients(filter?: FillingRecipeIngredientsFilter[]): Result<IterableIterator<IResolvedFillingIngredient<IIngredient<IngredientEntity>>, any, any>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>filter</td><td>FillingRecipeIngredientsFilter[]</td><td>Optional array of filters (OR semantics)
  - `undefined`/omitted: returns all ingredients
  - Empty array `[]`: returns nothing (empty iterator)
  - Non-empty array: returns ingredients matching at least one filter

Filter types:
  - `string`: Match ingredient ID exactly
  - `RegExp`: Match ingredient ID by pattern
  - `ICategoryFilter`: Match by category (literal or regex)</td></tr>
</tbody></table>

**Returns:**

Result&lt;IterableIterator&lt;[IResolvedFillingIngredient](IResolvedFillingIngredient.md)&lt;[IIngredient](IIngredient.md)&lt;[IngredientEntity](../type-aliases/IngredientEntity.md)&gt;&gt;, any, any&gt;&gt;

Success with matching ingredients iterator, or Failure if resolution fails
