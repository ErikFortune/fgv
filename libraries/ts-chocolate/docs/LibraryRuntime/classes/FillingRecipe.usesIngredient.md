[Home](../../README.md) > [LibraryRuntime](../README.md) > [FillingRecipe](./FillingRecipe.md) > usesIngredient

## FillingRecipe.usesIngredient() method

Checks if any version uses a specific ingredient.
By default, only checks preferred ingredients.
Pass `{ includeAlternates: true }` to also check alternate ingredients.

**Signature:**

```typescript
usesIngredient(ingredientId: IngredientId, options?: IIngredientQueryOptions): boolean;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>ingredientId</td><td>IngredientId</td><td>The ingredient ID to check</td></tr>
<tr><td>options</td><td>IIngredientQueryOptions</td><td>Query options</td></tr>
</tbody></table>

**Returns:**

boolean

True if the ingredient is used in any version
