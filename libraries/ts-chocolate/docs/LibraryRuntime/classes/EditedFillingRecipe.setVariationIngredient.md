[Home](../../README.md) > [LibraryRuntime](../README.md) > [EditedFillingRecipe](./EditedFillingRecipe.md) > setVariationIngredient

## EditedFillingRecipe.setVariationIngredient() method

Sets or updates an ingredient in a variation.
If `slotId` is provided, matches by slotId for disambiguation (required when the
same ingredient appears multiple times). Otherwise falls back to matching by
`ids.includes(ingredientId)`.
When no match is found, appends a new ingredient entry.
Recalculates baseWeight after the change.

**Signature:**

```typescript
setVariationIngredient(spec: FillingRecipeVariationSpec, ingredientId: IngredientId, amount: Measurement, unit?: MeasurementUnit, modifiers?: IIngredientModifiers, slotId?: SlotId): Result<true>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>FillingRecipeVariationSpec</td><td>Variation spec to update</td></tr>
<tr><td>ingredientId</td><td>IngredientId</td><td>The ingredient ID to set</td></tr>
<tr><td>amount</td><td>Measurement</td><td>Amount of the ingredient</td></tr>
<tr><td>unit</td><td>MeasurementUnit</td><td>Optional measurement unit (default: 'g')</td></tr>
<tr><td>modifiers</td><td>IIngredientModifiers</td><td>Optional ingredient modifiers</td></tr>
<tr><td>slotId</td><td>SlotId</td><td>Optional slot ID for disambiguation when the same ingredient appears multiple times</td></tr>
</tbody></table>

**Returns:**

Result&lt;true&gt;

Success or failure if spec not found
