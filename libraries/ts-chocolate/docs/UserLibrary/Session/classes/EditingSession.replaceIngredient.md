[Home](../../../README.md) > [UserLibrary](../../README.md) > [Session](../README.md) > [EditingSession](./EditingSession.md) > replaceIngredient

## EditingSession.replaceIngredient() method

Replaces an existing ingredient with a new one at the same position.

**Signature:**

```typescript
replaceIngredient(oldId: IngredientId, newId: IngredientId, amount: Measurement, unit?: MeasurementUnit, modifiers?: IIngredientModifiers): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>oldId</td><td>IngredientId</td><td>Ingredient ID to replace</td></tr>
<tr><td>newId</td><td>IngredientId</td><td>New ingredient ID</td></tr>
<tr><td>amount</td><td>Measurement</td><td>Amount of ingredient</td></tr>
<tr><td>unit</td><td>MeasurementUnit</td><td>Optional measurement unit</td></tr>
<tr><td>modifiers</td><td>IIngredientModifiers</td><td>Optional ingredient modifiers</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success or failure
