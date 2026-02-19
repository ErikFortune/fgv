[Home](../../README.md) > [LibraryRuntime](../README.md) > [EditedFillingRecipe](./EditedFillingRecipe.md) > createBlankVariation

## EditedFillingRecipe.createBlankVariation() method

Creates a new blank variation and adds it to the recipe.
Auto-generates a unique spec from the given date (default today) and optional name.

**Signature:**

```typescript
createBlankVariation(options?: IGenerateVariationSpecOptions): Result<FillingRecipeVariationSpec>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>options</td><td>IGenerateVariationSpecOptions</td><td>Optional date, index, and name for spec generation</td></tr>
</tbody></table>

**Returns:**

Result&lt;[FillingRecipeVariationSpec](../../type-aliases/FillingRecipeVariationSpec.md)&gt;

Result with the new variation's spec, or failure
