[Home](../../README.md) > [LibraryRuntime](../README.md) > [FillingRecipe](./FillingRecipe.md) > getIngredientIds

## FillingRecipe.getIngredientIds() method

Gets unique ingredient IDs used across all variations.
By default, returns only preferred ingredients (primary choice for each ingredient slot).
Pass `{ includeAlternates: true }` to include all ingredient options.

**Signature:**

```typescript
getIngredientIds(options?: IIngredientQueryOptions): ReadonlySet<IngredientId>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>options</td><td>IIngredientQueryOptions</td><td>Query options</td></tr>
</tbody></table>

**Returns:**

ReadonlySet&lt;[IngredientId](../../type-aliases/IngredientId.md)&gt;

Set of ingredient IDs
