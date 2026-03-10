[Home](../../README.md) > [LibraryRuntime](../README.md) > [EditedFillingRecipe](./EditedFillingRecipe.md) > setVariationNotes

## EditedFillingRecipe.setVariationNotes() method

Sets or clears the notes on a variation.

**Signature:**

```typescript
setVariationNotes(spec: FillingRecipeVariationSpec, notes: readonly ICategorizedNote[] | undefined): Result<true>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>FillingRecipeVariationSpec</td><td>Variation spec to update</td></tr>
<tr><td>notes</td><td>readonly ICategorizedNote[] | undefined</td><td>Notes array, or undefined to clear</td></tr>
</tbody></table>

**Returns:**

Result&lt;true&gt;

Success or failure if spec not found
