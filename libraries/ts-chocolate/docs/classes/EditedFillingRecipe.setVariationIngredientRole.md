[Home](../README.md) > [EditedFillingRecipe](./EditedFillingRecipe.md) > setVariationIngredientRole

## EditedFillingRecipe.setVariationIngredientRole() method

Sets or clears the role label on a specific ingredient in a variation.
The role is a free-text label describing the purpose of this ingredient entry
(e.g., "heated", "cold", "for ganache base"), used to distinguish duplicate
uses of the same ingredient.

**Signature:**

```typescript
setVariationIngredientRole(spec: FillingRecipeVariationSpec, ingredientId: IngredientId, role: IngredientRole | undefined, slotId?: SlotId): Result<true>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>FillingRecipeVariationSpec</td><td>Variation spec to update</td></tr>
<tr><td>ingredientId</td><td>IngredientId</td><td>The ingredient ID to find</td></tr>
<tr><td>role</td><td>IngredientRole | undefined</td><td>Role label, or undefined to clear</td></tr>
<tr><td>slotId</td><td>SlotId</td><td>Optional slot ID for disambiguation</td></tr>
</tbody></table>

**Returns:**

Result&lt;true&gt;

Success or failure if spec or ingredient not found
