[Home](../README.md) > [EditedFillingRecipe](./EditedFillingRecipe.md) > removeVariationIngredient

## EditedFillingRecipe.removeVariationIngredient() method

Removes an ingredient from a variation.
Removes the entire ingredient slot matched by slotId (if provided) or by
`ids.includes(ingredientId)`.
Recalculates baseWeight after the change.

**Signature:**

```typescript
removeVariationIngredient(spec: FillingRecipeVariationSpec, ingredientId: IngredientId, slotId?: SlotId): Result<true>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>FillingRecipeVariationSpec</td><td>Variation spec to update</td></tr>
<tr><td>ingredientId</td><td>IngredientId</td><td>The ingredient ID to find and remove</td></tr>
<tr><td>slotId</td><td>SlotId</td><td>Optional slot ID for disambiguation</td></tr>
</tbody></table>

**Returns:**

Result&lt;true&gt;

Success or failure if spec or ingredient not found
