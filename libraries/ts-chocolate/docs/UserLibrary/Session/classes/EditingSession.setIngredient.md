[Home](../../../README.md) > [UserLibrary](../../README.md) > [Session](../README.md) > [EditingSession](./EditingSession.md) > setIngredient

## EditingSession.setIngredient() method

Sets or updates an ingredient in the filling.

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
<tr><td>modifiers</td><td>IIngredientModifiers</td><td>Optional ingredient modifiers (spoonLevel, toTaste)</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success or failure
