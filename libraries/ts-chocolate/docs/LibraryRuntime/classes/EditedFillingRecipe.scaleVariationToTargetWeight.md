[Home](../../README.md) > [LibraryRuntime](../README.md) > [EditedFillingRecipe](./EditedFillingRecipe.md) > scaleVariationToTargetWeight

## EditedFillingRecipe.scaleVariationToTargetWeight() method

Scales all weight-contributing ingredients in a variation to achieve a target weight.
Non-weight-contributing ingredients (tsp, Tbsp, pinch, seeds, pods) remain unchanged.
Recalculates baseWeight after scaling.

**Signature:**

```typescript
scaleVariationToTargetWeight(spec: FillingRecipeVariationSpec, targetWeight: Measurement): Result<Measurement>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>FillingRecipeVariationSpec</td><td>Variation spec to scale</td></tr>
<tr><td>targetWeight</td><td>Measurement</td><td>Desired total weight</td></tr>
</tbody></table>

**Returns:**

Result&lt;[Measurement](../../type-aliases/Measurement.md)&gt;

Success with actual achieved weight, or failure
