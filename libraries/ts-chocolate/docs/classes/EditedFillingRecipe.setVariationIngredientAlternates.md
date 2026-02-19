[Home](../README.md) > [EditedFillingRecipe](./EditedFillingRecipe.md) > setVariationIngredientAlternates

## EditedFillingRecipe.setVariationIngredientAlternates() method

Updates the alternate ingredient IDs and preferred selection for a specific ingredient
in a variation. Matched by finding the ingredient whose ids array contains currentPrimaryId.

**Signature:**

```typescript
setVariationIngredientAlternates(spec: FillingRecipeVariationSpec, currentPrimaryId: IngredientId, ids: readonly IngredientId[], preferredId: IngredientId): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>FillingRecipeVariationSpec</td><td>Variation spec to update</td></tr>
<tr><td>currentPrimaryId</td><td>IngredientId</td><td>The ingredient ID currently used to identify the slot</td></tr>
<tr><td>ids</td><td>readonly IngredientId[]</td><td>New full list of ingredient IDs (primary + alternates)</td></tr>
<tr><td>preferredId</td><td>IngredientId</td><td>Which ID to mark as preferred</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success or failure if spec or ingredient not found
