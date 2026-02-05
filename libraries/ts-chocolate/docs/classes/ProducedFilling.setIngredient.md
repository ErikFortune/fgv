[Home](../README.md) > [ProducedFilling](./ProducedFilling.md) > setIngredient

## ProducedFilling.setIngredient() method

Sets or updates an ingredient.
Pushes current state to undo before change, clears redo.

**Signature:**

```typescript
setIngredient(id: IngredientId, amount: Measurement, unit?: MeasurementUnit, modifiers?: IIngredientModifiers): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>id</td><td>IngredientId</td><td>Ingredient ID</td></tr>
<tr><td>amount</td><td>Measurement</td><td>Amount of ingredient</td></tr>
<tr><td>unit</td><td>MeasurementUnit</td><td>Optional measurement unit (default: 'g')</td></tr>
<tr><td>modifiers</td><td>IIngredientModifiers</td><td>Optional ingredient modifiers</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success or failure
