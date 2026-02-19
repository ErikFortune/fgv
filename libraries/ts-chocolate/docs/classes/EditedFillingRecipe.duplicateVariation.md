[Home](../README.md) > [EditedFillingRecipe](./EditedFillingRecipe.md) > duplicateVariation

## EditedFillingRecipe.duplicateVariation() method

Duplicates an existing variation, creating a new one with a unique spec.
Copies ingredients, procedures, ratings, and notes from the source.

**Signature:**

```typescript
duplicateVariation(sourceSpec: FillingRecipeVariationSpec, options?: IGenerateVariationSpecOptions): Result<FillingRecipeVariationSpec>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>sourceSpec</td><td>FillingRecipeVariationSpec</td><td>The variation spec to copy from</td></tr>
<tr><td>options</td><td>IGenerateVariationSpecOptions</td><td>Optional date, index, and name for the new spec</td></tr>
</tbody></table>

**Returns:**

Result&lt;[FillingRecipeVariationSpec](../type-aliases/FillingRecipeVariationSpec.md)&gt;

Result with the new variation's spec, or failure
