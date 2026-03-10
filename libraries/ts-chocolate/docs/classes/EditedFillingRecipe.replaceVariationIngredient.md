[Home](../README.md) > [EditedFillingRecipe](./EditedFillingRecipe.md) > replaceVariationIngredient

## EditedFillingRecipe.replaceVariationIngredient() method

Replaces an ingredient in a variation, preserving the alternates list.
Finds the ingredient slot whose `ids` contains `oldId`.
If `newId` is already in `ids`, just updates `preferredId` and amount.
If not, adds `newId` to `ids` and sets it as preferred.

**Signature:**

```typescript
replaceVariationIngredient(spec: FillingRecipeVariationSpec, oldId: IngredientId, newId: IngredientId, amount: Measurement, unit?: MeasurementUnit, modifiers?: IIngredientModifiers): Result<true>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>FillingRecipeVariationSpec</td><td>Variation spec to update</td></tr>
<tr><td>oldId</td><td>IngredientId</td><td>Current ingredient ID to find the slot</td></tr>
<tr><td>newId</td><td>IngredientId</td><td>New ingredient ID to set as preferred</td></tr>
<tr><td>amount</td><td>Measurement</td><td>Amount of the ingredient</td></tr>
<tr><td>unit</td><td>MeasurementUnit</td><td>Optional measurement unit</td></tr>
<tr><td>modifiers</td><td>IIngredientModifiers</td><td>Optional ingredient modifiers</td></tr>
</tbody></table>

**Returns:**

Result&lt;true&gt;

Success or failure if spec or ingredient not found
