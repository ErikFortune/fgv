[Home](../README.md) > [EditedFillingRecipe](./EditedFillingRecipe.md) > setGoldenVariationSpec

## EditedFillingRecipe.setGoldenVariationSpec() method

Sets the golden variation spec.

**Signature:**

```typescript
setGoldenVariationSpec(spec: FillingRecipeVariationSpec): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>FillingRecipeVariationSpec</td><td>Variation spec to set as golden; must exist in variations</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success or failure if spec not found
