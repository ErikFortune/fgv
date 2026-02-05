[Home](../../../README.md) > [LibraryRuntime](../../README.md) > [Internal](../README.md) > [IWeightCalculationContext](./IWeightCalculationContext.md) > getIngredientDensity

## IWeightCalculationContext.getIngredientDensity() method

Get the density (g/mL) for an ingredient.

**Signature:**

```typescript
getIngredientDensity(id: IngredientId): number;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>id</td><td>IngredientId</td><td>The ingredient ID to look up</td></tr>
</tbody></table>

**Returns:**

number

The density in g/mL, or 1.0 if not specified
