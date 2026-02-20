[Home](../README.md) > [EditedConfectionRecipe](./EditedConfectionRecipe.md) > createBlankVariation

## EditedConfectionRecipe.createBlankVariation() method

Creates a new blank variation and adds it to the recipe.
Type-specific required fields are copied from the golden variation.
Auto-generates a unique spec from the given date (default today) and optional name.

**Signature:**

```typescript
createBlankVariation(options?: IGenerateVariationSpecOptions): Result<ConfectionRecipeVariationSpec>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>options</td><td>IGenerateVariationSpecOptions</td><td>Optional date, index, and name for spec generation</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ConfectionRecipeVariationSpec](../type-aliases/ConfectionRecipeVariationSpec.md)&gt;

Result with the new variation's spec, or failure
