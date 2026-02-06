[Home](../../README.md) > [LibraryRuntime](../README.md) > [FillingRecipe](./FillingRecipe.md) > getVariation

## FillingRecipe.getVariation() method

Gets a specific variation by ID.

**Signature:**

```typescript
getVariation(variationSpec: FillingRecipeVariationSpec): Result<FillingRecipeVariation>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>variationSpec</td><td>FillingRecipeVariationSpec</td><td>The variation ID to find</td></tr>
</tbody></table>

**Returns:**

Result&lt;[FillingRecipeVariation](../../classes/FillingRecipeVariation.md)&gt;

Success with FillingRecipeVariation, or Failure if not found
