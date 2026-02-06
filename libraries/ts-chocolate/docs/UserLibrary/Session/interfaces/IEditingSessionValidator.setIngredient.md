[Home](../../../README.md) > [UserLibrary](../../README.md) > [Session](../README.md) > [IEditingSessionValidator](./IEditingSessionValidator.md) > setIngredient

## IEditingSessionValidator.setIngredient() method

Sets or updates an ingredient using weakly-typed inputs

**Signature:**

```typescript
setIngredient(id: string, amount: number, unit?: MeasurementUnit, modifiers?: IIngredientModifiers): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>id</td><td>string</td><td>Ingredient ID (will be converted)</td></tr>
<tr><td>amount</td><td>number</td><td>Amount (will be converted)</td></tr>
<tr><td>unit</td><td>MeasurementUnit</td><td>Optional measurement unit</td></tr>
<tr><td>modifiers</td><td>IIngredientModifiers</td><td>Optional ingredient modifiers</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success or Failure
