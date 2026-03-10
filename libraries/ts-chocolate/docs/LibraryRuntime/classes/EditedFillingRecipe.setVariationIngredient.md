[Home](../../README.md) > [LibraryRuntime](../README.md) > [EditedFillingRecipe](./EditedFillingRecipe.md) > setVariationIngredient

## EditedFillingRecipe.setVariationIngredient() method

Sets or updates an ingredient in a variation.
If an ingredient slot whose `ids` contains `ingredientId` already exists, updates it.
Otherwise appends a new ingredient with `ids: [ingredientId]`.
Recalculates baseWeight after the change.

**Signature:**

```typescript
setVariationIngredient(spec: FillingRecipeVariationSpec, ingredientId: IngredientId, amount: Measurement, unit?: MeasurementUnit, modifiers?: IIngredientModifiers): Result<true>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>FillingRecipeVariationSpec</td><td>Variation spec to update</td></tr>
<tr><td>ingredientId</td><td>IngredientId</td><td>The ingredient ID to set</td></tr>
<tr><td>amount</td><td>Measurement</td><td>Amount of the ingredient</td></tr>
<tr><td>unit</td><td>MeasurementUnit</td><td>Optional measurement unit (default: 'g')</td></tr>
<tr><td>modifiers</td><td>IIngredientModifiers</td><td>Optional ingredient modifiers</td></tr>
</tbody></table>

**Returns:**

Result&lt;true&gt;

Success or failure if spec not found
