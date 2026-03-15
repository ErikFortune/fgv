[Home](../README.md) > [EditedConfectionRecipe](./EditedConfectionRecipe.md) > duplicateVariation

## EditedConfectionRecipe.duplicateVariation() method

Duplicates an existing variation, creating a new one with a unique spec.
Copies all fields from the source variation.

**Signature:**

```typescript
duplicateVariation(sourceSpec: ConfectionRecipeVariationSpec, options?: IGenerateVariationSpecOptions): Result<ConfectionRecipeVariationSpec>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>sourceSpec</td><td>ConfectionRecipeVariationSpec</td><td>The variation spec to copy from</td></tr>
<tr><td>options</td><td>IGenerateVariationSpecOptions</td><td>Optional date, index, and name for the new spec</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ConfectionRecipeVariationSpec](../type-aliases/ConfectionRecipeVariationSpec.md)&gt;

Result with the new variation's spec, or failure
