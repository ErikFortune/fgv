[Home](../../README.md) > [LibraryRuntime](../README.md) > [EditedFillingRecipe](./EditedFillingRecipe.md) > setVariationIngredientSlotId

## EditedFillingRecipe.setVariationIngredientSlotId() method

Sets or clears the slotId on a specific ingredient in a variation.
The slotId is used as a stable identifier for disambiguating duplicate ingredients.

**Signature:**

```typescript
setVariationIngredientSlotId(spec: FillingRecipeVariationSpec, ingredientId: IngredientId, currentSlotId: SlotId | undefined, newSlotId: SlotId | undefined): Result<true>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>FillingRecipeVariationSpec</td><td>Variation spec to update</td></tr>
<tr><td>ingredientId</td><td>IngredientId</td><td>The ingredient ID to find</td></tr>
<tr><td>currentSlotId</td><td>SlotId | undefined</td><td>Current slotId to locate the ingredient (undefined to match by ingredientId only)</td></tr>
<tr><td>newSlotId</td><td>SlotId | undefined</td><td>New slotId to set, or undefined to clear</td></tr>
</tbody></table>

**Returns:**

Result&lt;true&gt;

Success or failure if spec or ingredient not found
