[Home](../../README.md) > [LibraryRuntime](../README.md) > [EditedFillingRecipe](./EditedFillingRecipe.md) > replaceVariation

## EditedFillingRecipe.replaceVariation() method

Replaces a variation's entity data (called after EditingSession save).

**Signature:**

```typescript
replaceVariation(spec: FillingRecipeVariationSpec, variation: IFillingRecipeVariationEntity): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>FillingRecipeVariationSpec</td><td>Variation spec to replace</td></tr>
<tr><td>variation</td><td>IFillingRecipeVariationEntity</td><td>New variation entity data</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success or failure if spec not found
