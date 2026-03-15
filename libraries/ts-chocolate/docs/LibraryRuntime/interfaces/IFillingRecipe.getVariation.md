[Home](../../README.md) > [LibraryRuntime](../README.md) > [IFillingRecipe](./IFillingRecipe.md) > getVariation

## IFillingRecipe.getVariation() method

Gets a specific variation by FillingRecipeVariationSpec | variation specifier.

**Signature:**

```typescript
getVariation(variationSpec: FillingRecipeVariationSpec): Result<IFillingRecipeVariation>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>variationSpec</td><td>FillingRecipeVariationSpec</td><td>The variation specifier to find</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IFillingRecipeVariation](../../interfaces/IFillingRecipeVariation.md)&gt;

Success with RuntimeFillingRecipeVariation, or Failure if not found
